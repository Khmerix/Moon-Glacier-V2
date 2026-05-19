/**
 * GLACIER MARKDOWN PARSER
 * Converts contributor-friendly .md files into engine-ready chapter objects
 * Format: Frontmatter YAML + blockquoted narrative + ## Choices section
 */
const GlacierParser = (function() {

    async function loadChapter(id) {
        try {
            const response = await fetch(`chapters/${id}.md`);
            if (!response.ok) throw new Error(`Chapter ${id} not found`);
            const text = await response.text();
            return parseMarkdown(text, id);
        } catch (e) {
            console.error('Failed to load chapter:', e);
            return null;
        }
    }

    function normalizeCharKey(name) {
        const map = {
            'commander voss': 'voss',
            'commander elias voss': 'voss',
            'dr. elara chen': 'elara',
            'dr elara chen': 'elara',
            'elara chen': 'elara',
            'dr. silas fenwick': 'fenwick',
            'dr silas fenwick': 'fenwick',
            'silas fenwick': 'fenwick',
            'the entity': 'entity',
            'gl-7 system': 'system',
            'gl7 system': 'system'
        };
        const lower = name.toLowerCase().trim();
        return map[lower] || lower.replace(/\s+/g, '');
    }

    function parseMarkdown(text, fallbackId) {
        const lines = text.split('\n');
        let chapter = {
            id: fallbackId,
            title: '',
            type: 'story',
            location: '',
            time: '',
            image: '',
            ambient: '',
            music: '',
            content: [],
            choices: [],
            worldUpdate: null
        };

        let mode = 'frontmatter'; // frontmatter | content | choices
        let currentBlock = null;
        let frontmatterBuffer = [];
        let choiceBuffer = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trimRight();
            const trimmed = line.trim();

            // Frontmatter delimiter
            if (trimmed === '---') {
                if (mode === 'frontmatter') {
                    if (frontmatterBuffer.length > 0) {
                        // End of frontmatter, parse it
                        Object.assign(chapter, parseFrontmatter(frontmatterBuffer.join('\n')));
                        mode = 'content';
                    } else {
                        frontmatterBuffer.push(''); // Start collecting
                    }
                }
                continue;
            }

            if (mode === 'frontmatter' && frontmatterBuffer.length > 0) {
                frontmatterBuffer.push(line);
                continue;
            }

            // Choices section header
            if (trimmed.match(/^#{1,3}\s*choices?/i)) {
                mode = 'choices';
                continue;
            }

            // World update block
            if (trimmed.match(/^#{1,3}\s*world[-_]?update/i)) {
                mode = 'worldupdate';
                continue;
            }

            // Content parsing
            if (mode === 'content') {
                // Blockquote narrative: > **NARRATION** or > **DIALOGUE: Name**
                if (trimmed.startsWith('>')) {
                    const content = trimmed.substring(1).trim();

                    // Check for directive: **NARRATION**, **DIALOGUE: Name**, etc.
                    const directiveMatch = content.match(/^\*\*([A-Z]+)(?::\s*(.+?))?\*\*(.*)$/);

                    if (directiveMatch) {
                        const blockType = directiveMatch[1].toLowerCase();
                        const blockMeta = directiveMatch[2] ? directiveMatch[2].trim() : '';
                        const blockText = directiveMatch[3].trim();

                        if (blockType === 'narration') {
                            chapter.content.push({
                                type: 'narration',
                                text: blockText || blockMeta
                            });
                        } else if (blockType === 'dialogue') {
                            const charMatch = blockMeta.match(/^(.+?)(?:\s+\*(.+?)\*)?$/);
                            const rawName = charMatch ? charMatch[1].trim() : blockMeta.trim();
                            chapter.content.push({
                                type: 'dialogue',
                                char: normalizeCharKey(rawName),
                                text: blockText,
                                emotion: charMatch && charMatch[2] ? charMatch[2].trim() : ''
                            });
                        } else if (blockType === 'system') {
                            chapter.content.push({
                                type: 'dialogue',
                                char: 'system',
                                text: blockText || blockMeta
                            });
                        }
                    } else {
                        // Plain blockquote = narration
                        chapter.content.push({
                            type: 'narration',
                            text: content
                        });
                    }
                }

                // Image reference: ![alt](path)
                const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imgMatch && !chapter.image) {
                    chapter.image = imgMatch[2];
                }
            }

            // Choices parsing
            if (mode === 'choices') {
                // Choice line: - **Choice text** → target-id
                const choiceLineMatch = trimmed.match(/^[-*]\s*\*\*(.+?)\*\*\s*→\s*(\S+)(.*)$/);
                if (choiceLineMatch) {
                    if (choiceBuffer) chapter.choices.push(choiceBuffer);
                    choiceBuffer = {
                        id: `${chapter.id}-c${chapter.choices.length}`,
                        text: choiceLineMatch[1].trim(),
                        target: choiceLineMatch[2].trim(),
                        effects: {},
                        condition: null,
                        flavor: '',
                        giveItem: null,
                        removeItem: null
                    };
                    // Check for inline effects in remainder: (courage +1, tech -1)
                    const inlineEffects = choiceLineMatch[3].match(/\(([^)]+)\)/);
                    if (inlineEffects) {
                        parseInlineEffects(choiceBuffer, inlineEffects[1]);
                    }
                    continue;
                }

                // Choice metadata lines (indented under choice)
                if (choiceBuffer && (line.startsWith('  ') || line.startsWith('\t'))) {
                    const meta = trimmed;

                    // *Effects: courage +1, tech +2*
                    const effectsMatch = meta.match(/^\*effects?:\s*(.+?)\*$/i);
                    if (effectsMatch) {
                        parseInlineEffects(choiceBuffer, effectsMatch[1]);
                    }

                    // *Condition: hasItem keycard* or *Condition: stat courage >= 2*
                    const condMatch = meta.match(/^\*condition?:\s*(.+?)\*$/i);
                    if (condMatch) {
                        choiceBuffer.condition = parseCondition(condMatch[1]);
                    }

                    // *Flavor: description*
                    const flavorMatch = meta.match(/^\*flavor?:\s*(.+?)\*$/i);
                    if (flavorMatch) {
                        choiceBuffer.flavor = flavorMatch[1];
                    }

                    // *Give: item-name* or *Item: item-name*
                    const giveMatch = meta.match(/^\*(?:give|item):\s*(.+?)\*$/i);
                    if (giveMatch) {
                        choiceBuffer.giveItem = giveMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
                    }

                    // *Remove: item-name*
                    const removeMatch = meta.match(/^\*remove:\s*(.+?)\*$/i);
                    if (removeMatch) {
                        choiceBuffer.removeItem = removeMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
                    }
                }
            }

            // World update parsing
            if (mode === 'worldupdate') {
                const kvMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
                if (kvMatch) {
                    if (!chapter.worldUpdate) chapter.worldUpdate = {};
                    const key = kvMatch[1];
                    const val = kvMatch[2];
                    chapter.worldUpdate[key] = val === 'true' ? true : val === 'false' ? false : 
                        !isNaN(parseFloat(val)) ? parseFloat(val) : val;
                }
            }
        }

        // Push last choice
        if (choiceBuffer) chapter.choices.push(choiceBuffer);

        return chapter;
    }

    function parseFrontmatter(text) {
        const result = {};
        const lines = text.split('\n');
        let currentKey = null;
        let currentVal = '';

        for (const line of lines) {
            const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
            if (match) {
                if (currentKey) result[currentKey] = currentVal.trim();
                currentKey = match[1];
                currentVal = match[2];
            } else if (currentKey && line.startsWith('  ')) {
                currentVal += '\n' + line.trim();
            }
        }
        if (currentKey) result[currentKey] = currentVal.trim();
        return result;
    }

    function parseInlineEffects(choice, effectsStr) {
        // Format: "courage +1, tech -2, kaelTrust +3"
        const parts = effectsStr.split(/,\s*/);
        parts.forEach(part => {
            const match = part.match(/^([a-zA-Z0-9_-]+)\s*([+-]?\d+)$/);
            if (match) {
                choice.effects[match[1]] = parseInt(match[2]);
            }
        });
    }

    function parseCondition(condStr) {
        // Format: "hasItem keycard" or "stat courage >= 2" or "worldState reactorFixed true"
        condStr = condStr.trim();

        const hasItemMatch = condStr.match(/^hasItem\s+(.+)$/i);
        if (hasItemMatch) return { hasItem: hasItemMatch[1].toLowerCase().replace(/\s+/g, '-') };

        const statMatch = condStr.match(/^stat\s+([a-zA-Z0-9_-]+)\s*>=?\s*(\d+)$/i);
        if (statMatch) return { stat: { [statMatch[1]]: parseInt(statMatch[2]) } };

        const worldMatch = condStr.match(/^worldState\s+([a-zA-Z0-9_-]+)\s+(true|false)$/i);
        if (worldMatch) return { worldState: { [worldMatch[1]]: worldMatch[2].toLowerCase() === 'true' } };

        const flagMatch = condStr.match(/^flag\s+([a-zA-Z0-9_-]+)$/i);
        if (flagMatch) return { flag: flagMatch[1] };

        return null;
    }

    return { loadChapter, parseMarkdown };
})();
