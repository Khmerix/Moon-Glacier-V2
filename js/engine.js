/**
 * GLACIER MOON ENGINE v3.0
 * Markdown-driven story renderer
 * Fetches .md files from /chapters/ and parses them at runtime
 */
const GlacierEngine = (function() {
    const dom = {};
    let typewriterInterval = null;
    let ambientAudio = null;
    let chapterCache = {}; // Cache parsed chapters
    let characters = {};

    // Character definitions (loaded from lore/characters.md or hardcoded fallback)
    const CHARACTERS = {
        voss: { name: "Commander Elias Voss", color: "#00d4ff", avatar: "visuals/chars/voss.png", bio: "Mission Commander" },
        elara: { name: "Dr. Elara Chen", color: "#ff6b9d", avatar: "visuals/chars/elara.png", bio: "Xenobiologist" },
        fenwick: { name: "Dr. Silas Fenwick", color: "#a0a0a0", avatar: "visuals/chars/fenwick.png", bio: "Missing Geologist" },
        entity: { name: "The Entity", color: "#d4af37", avatar: "visuals/chars/entity.png", bio: "Resonant Interface" },
        system: { name: "GL-7 System", color: "#ff4757", bio: "Outpost AI" }
    };

    function init() {
        dom.container = document.getElementById('glacier-app');
        dom.chapterTitle = document.getElementById('chapter-title');
        dom.locationTime = document.getElementById('location-time');
        dom.storyContent = document.getElementById('story-content');
        dom.choicesContainer = document.getElementById('choices-container');
        dom.chapterImage = document.getElementById('chapter-image');
        dom.statsPanel = document.getElementById('stats-panel');
        dom.inventoryPanel = document.getElementById('inventory-panel');
        dom.saveIndicator = document.getElementById('save-indicator');
        dom.menuOverlay = document.getElementById('menu-overlay');

        document.getElementById('btn-menu').addEventListener('click', toggleMenu);
        document.getElementById('btn-save').addEventListener('click', exportSave);
        document.getElementById('btn-load').addEventListener('click', importSave);
        document.getElementById('btn-reset').addEventListener('click', confirmReset);
        document.getElementById('btn-close-menu').addEventListener('click', toggleMenu);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(); });

        // Load first chapter
        loadAndRender(GlacierState.get().currentChapter);
    }

    async function loadAndRender(chapterId) {
        // Check cache
        let chapter = chapterCache[chapterId];

        if (!chapter) {
            // Fetch and parse markdown
            chapter = await GlacierParser.loadChapter(chapterId);
            if (!chapter) {
                // Fallback: show error with helpful message
                showError(chapterId);
                return;
            }
            chapterCache[chapterId] = chapter;
        }

        renderChapter(chapter);
    }

    function renderChapter(chapter) {
        const state = GlacierState.get();

        // Mark visited
        GlacierState.visitChapter(chapter.id);

        // Apply world updates
        if (chapter.worldUpdate) {
            Object.assign(state.worldState, chapter.worldUpdate);
            GlacierState.save();
        }

        // Clear
        clearTypewriter();
        dom.storyContent.innerHTML = '';
        dom.choicesContainer.innerHTML = '';

        // Header
        dom.chapterTitle.textContent = chapter.title || 'Unknown Chapter';
        dom.locationTime.textContent = chapter.location && chapter.time 
            ? `${chapter.location} // ${chapter.time}` : '';

        // Image
        if (chapter.image) {
            dom.chapterImage.style.opacity = '0';
            setTimeout(() => {
                dom.chapterImage.src = chapter.image;
                dom.chapterImage.style.opacity = '1';
            }, 300);
        } else {
            dom.chapterImage.style.opacity = '0';
        }

        // Audio
        if (chapter.ambient || chapter.music) {
            playAudio(chapter.ambient || chapter.music, chapter.music ? 0.4 : 0.2);
        }

        // Content blocks
        if (chapter.content && chapter.content.length > 0) {
            renderContentBlocks(chapter.content, 0);
        }

        // HUD
        updateHUD(state);
        showSaveIndicator();

        // Ending
        if (chapter.type === 'ending') {
            GlacierState.recordEnding(chapter.id);
            renderEndingBadge(chapter.tier || 'silver');
        }
    }

    function renderContentBlocks(blocks, index) {
        if (index >= blocks.length) {
            renderChoices();
            return;
        }

        const block = blocks[index];
        const el = document.createElement('div');
        el.className = `content-block ${block.type}`;

        if (block.type === 'dialogue') {
            const charData = CHARACTERS[block.char] || { name: block.char, color: '#fff' };
            const avatarImg = charData.avatar ? `<img class="char-avatar" src="${charData.avatar}" alt="${charData.name}" onerror="this.style.display='none'">` : '';
            const speakBtn = typeof window.speakDialogue === 'function' ? `<button class="speak-btn" onclick="window.speakDialogue('${block.text.replace(/'/g, "\\'")}', this)" title="Read aloud">&#9654;</button>` : '';
            el.innerHTML = `
                <div class="dialogue-header" style="--char-color: ${charData.color}">
                    ${avatarImg}
                    <span class="char-name">${charData.name}${speakBtn}</span>
                    ${block.emotion ? `<span class="emotion-tag">${block.emotion}</span>` : ''}
                </div>
                <div class="dialogue-text"></div>
            `;
            dom.storyContent.appendChild(el);
            typewrite(el.querySelector('.dialogue-text'), block.text, () => {
                setTimeout(() => renderContentBlocks(blocks, index + 1), 400);
            });
        } else if (block.type === 'narration') {
            el.innerHTML = `<div class="narration-text"></div>`;
            dom.storyContent.appendChild(el);
            typewrite(el.querySelector('.narration-text'), block.text, () => {
                setTimeout(() => renderContentBlocks(blocks, index + 1), 300);
            });
        } else {
            el.textContent = block.text || '';
            dom.storyContent.appendChild(el);
            renderContentBlocks(blocks, index + 1);
        }

        dom.storyContent.scrollTop = dom.storyContent.scrollHeight;
    }

    function typewrite(element, text, callback) {
        clearTypewriter();
        let i = 0;
        element.textContent = '';

        typewriterInterval = setInterval(() => {
            element.textContent += text.charAt(i);
            i++;
            dom.storyContent.scrollTop = dom.storyContent.scrollHeight;

            if (i >= text.length) {
                clearInterval(typewriterInterval);
                typewriterInterval = null;
                if (callback) callback();
            }
        }, 18);
    }

    function clearTypewriter() {
        if (typewriterInterval) {
            clearInterval(typewriterInterval);
            typewriterInterval = null;
        }
    }

    function renderChoices() {
        // Get current chapter from cache
        const chapterId = GlacierState.get().currentChapter;
        const chapter = chapterCache[chapterId];
        if (!chapter || !chapter.choices) return;

        dom.choicesContainer.innerHTML = '';

        chapter.choices.forEach((choice, idx) => {
            if (!GlacierState.checkCondition(choice.condition)) return;

            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.style.animationDelay = `${idx * 0.15}s`;

            let btnHTML = `<span class="choice-text">${escapeHtml(choice.text)}</span>`;
            if (choice.flavor) btnHTML += `<span class="choice-flavor">${escapeHtml(choice.flavor)}</span>`;

            if (choice.effects) {
                const effects = Object.entries(choice.effects)
                    .filter(([k]) => k in GlacierState.get().stats)
                    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`)
                    .join(', ');
                if (effects) btnHTML += `<span class="choice-effects">${effects}</span>`;
            }

            if (choice.giveItem) btnHTML += `<span class="choice-item gain">+ ${choice.giveItem}</span>`;
            if (choice.removeItem) btnHTML += `<span class="choice-item loss">- ${choice.removeItem}</span>`;

            btn.innerHTML = btnHTML;

            btn.addEventListener('click', () => {
                clearTypewriter();
                const nextChapter = GlacierState.makeChoice(chapter.id, choice);
                dom.container.classList.add('transitioning');
                setTimeout(() => {
                    dom.container.classList.remove('transitioning');
                    loadAndRender(nextChapter);
                }, 600);
            });

            dom.choicesContainer.appendChild(btn);
        });

        if (dom.choicesContainer.children.length === 0) {
            const btn = document.createElement('button');
            btn.className = 'choice-btn continue-btn';
            btn.textContent = 'End of current path. Explore other branches from menu.';
            btn.addEventListener('click', toggleMenu);
            dom.choicesContainer.appendChild(btn);
        }
    }

    function updateHUD(state) {
        const statsHTML = Object.entries(state.stats)
            .filter(([k, v]) => v !== 0)
            .map(([k, v]) => {
                const barWidth = Math.min(Math.max((v + 10) * 5, 0), 100);
                const color = v > 0 ? '#00d4ff' : v < 0 ? '#ff4757' : '#a0a0a0';
                return `
                    <div class="stat-row">
                        <span class="stat-name">${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                        <div class="stat-bar"><div class="stat-fill" style="width:${barWidth}%;background:${color}"></div></div>
                        <span class="stat-val" style="color:${color}">${v > 0 ? '+' : ''}${v}</span>
                    </div>
                `;
            }).join('');
        dom.statsPanel.innerHTML = statsHTML || '<span class="empty-hud">No significant reputation yet</span>';

        if (state.inventory.length > 0) {
            dom.inventoryPanel.innerHTML = state.inventory.map(item => 
                `<span class="inv-item">${item.replace(/-/g, ' ')}</span>`
            ).join('');
        } else {
            dom.inventoryPanel.innerHTML = '<span class="empty-hud">Empty</span>';
        }

        const pt = GlacierState.getPlayTime();
        const mins = Math.floor(pt / 60);
        const secs = pt % 60;
        document.getElementById('play-time').textContent = 
            `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    }

    function renderEndingBadge(tier) {
        const badge = document.createElement('div');
        badge.className = `ending-badge ${tier}`;
        badge.innerHTML = `
            <div class="badge-glow"></div>
            <div class="badge-content">
                <h2>${tier.toUpperCase()} ENDING</h2>
                <p>Unlocked ${new Date().toLocaleDateString()}</p>
                <p style="font-size:0.8rem;margin-top:8px;opacity:0.7">Reset to explore other branches</p>
            </div>
        `;
        dom.storyContent.appendChild(badge);
    }

    function showError(chapterId) {
        dom.chapterTitle.textContent = 'Signal Lost';
        dom.locationTime.textContent = 'Unknown Sector // --';
        dom.storyContent.innerHTML = `
            <div class="content-block narration">
                <div class="narration-text" style="color:var(--danger)">
                    Unable to load chapter: <code>${chapterId}</code><br><br>
                    The chapter file may be missing from <code>/chapters/${chapterId}.md</code>.<br><br>
                    If you're a contributor, create this file and refresh.
                </div>
            </div>
        `;
        dom.choicesContainer.innerHTML = `
            <button class="choice-btn" onclick="location.reload()">
                <span class="choice-text">↻ Retry Connection</span>
            </button>
            <button class="choice-btn" onclick="GlacierState.reset();location.reload()">
                <span class="choice-text">⟲ Reset Timeline</span>
            </button>
        `;
    }

    function playAudio(src, volume = 0.3) {
        if (!src) return;
        if (ambientAudio) ambientAudio.pause();
        ambientAudio = new Audio(src);
        ambientAudio.volume = volume;
        ambientAudio.loop = true;
        ambientAudio.play().catch(e => console.log('Audio blocked:', e));
    }

    function toggleMenu() { dom.menuOverlay.classList.toggle('active'); }

    function exportSave() {
        const code = GlacierState.export();
        const el = document.createElement('textarea');
        el.value = code;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showSaveIndicator('Save code copied to clipboard!');
    }

    function importSave() {
        const code = prompt('Paste your save code:');
        if (code && GlacierState.import(code)) {
            loadAndRender(GlacierState.get().currentChapter);
            showSaveIndicator('Timeline restored!');
        } else {
            alert('Invalid save code.');
        }
    }

    function confirmReset() {
        if (confirm('WARNING: This will erase ALL progress, choices, and unlocked endings.\n\nAre you certain?')) {
            GlacierState.reset();
            chapterCache = {};
            loadAndRender('ch1-landing');
            toggleMenu();
        }
    }

    function showSaveIndicator(msg = 'Auto-saved') {
        dom.saveIndicator.textContent = msg;
        dom.saveIndicator.classList.add('show');
        setTimeout(() => dom.saveIndicator.classList.remove('show'), 2000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', GlacierEngine.init);
