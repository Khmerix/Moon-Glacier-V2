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

    // Chapter themes
    const CHAPTER_THEMES = {
        'ch1-ice-frontier': 'theme-ice',
        'ch2-cold-silence': 'theme-silence',
        'ch2-storm-surge': 'theme-silence',
        'ch3-deep-vein': 'theme-deep',
        'ch3-fortress-ice': 'theme-ice',
        'ch3-the-breach': 'theme-deep',
        'ch3-whiteout': 'theme-silence',
        'ch4-first-contact': 'theme-contact',
        'ch4-the-signal': 'theme-contact',
        'ch4-betrayal': 'theme-silence',
        'ch4-corporate-raid': 'theme-silence',
        'ch4-infection': 'theme-contact',
        'ch4-purge': 'theme-silence',
        'ch4-ghost-tracks': 'theme-deep',
        'ch4-buried': 'theme-ice',
        'ch5-awakening': 'theme-awakening',
        'ch5-the-price': 'theme-contact',
        'ch5-transcendence': 'theme-contact',
        'ch5-severance': 'theme-awakening',
        'ch5-hollow': 'theme-silence'
    };

    // Dramatic visual effects per chapter
    const CHAPTER_EFFECTS = {
        'ch2-storm-surge': 'lightning-flash',
        'ch3-the-breach': 'fog-overlay',
        'ch4-betrayal': 'screen-shake',
        'ch4-corporate-raid': 'screen-shake',
        'ch4-infection': 'blood-tint',
        'ch4-purge': 'screen-shake',
        'ch4-buried': 'blood-tint',
        'ch5-the-price': 'pulse-glow',
        'ch5-transcendence': 'pulse-glow'
    };

    // Character definitions (loaded from lore/characters.md or hardcoded fallback)
    const CHARACTERS = {
        kael: { name: "Kael Vance", color: "#00f0ff", avatar: "visuals/chars/kael.png", bio: "Commander" },
        marcus: { name: "Marcus Thorne", color: "#60a5fa", avatar: "visuals/chars/marcus.png", bio: "Engineer" },
        elara: { name: "Elara Synn", color: "#f472b6", avatar: "visuals/chars/elara.png", bio: "Xenobiologist" },
        nyx: { name: "Nyx Oriel", color: "#a78bfa", avatar: "visuals/chars/nyx.png", bio: "Pilot" },
        sera: { name: "Sera Voss", color: "#34d399", avatar: "visuals/chars/sera.png", bio: "Medic" },
        entity: { name: "The Entity", color: "#d4af37", avatar: "", bio: "Ancient Consciousness" }
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

        initStarfield();
        initHolographicTilt();

        // Load first chapter
        loadAndRender(GlacierState.get().currentChapter);
    }

    function applyTheme(chapterId) {
        const themeClass = CHAPTER_THEMES[chapterId] || 'theme-ice';
        document.body.className = themeClass;
        const chromatic = document.getElementById('chromatic');
        if (chromatic) {
            chromatic.classList.toggle('active', themeClass === 'theme-contact' || themeClass === 'theme-awakening');
        }
        // Apply/remove dramatic visual effects
        const effects = ['screen-shake', 'fog-overlay', 'lightning-flash', 'blood-tint', 'pulse-glow'];
        effects.forEach(eff => document.body.classList.remove(eff));
        const effect = CHAPTER_EFFECTS[chapterId];
        if (effect) {
            document.body.classList.add(effect);
        }
    }

    function initStarfield() {
        const canvas = document.getElementById('starfield-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let stars = [];
        const numStars = 250;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function init() {
            stars = [];
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.3,
                    speed: Math.random() * 0.3 + 0.05,
                    opacity: Math.random() * 0.6 + 0.2,
                    twinkleSpeed: Math.random() * 0.02 + 0.005,
                    twinkleOffset: Math.random() * Math.PI * 2
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const time = Date.now() * 0.001;

            stars.forEach(star => {
                const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinkleOffset) * 0.3 + 0.7;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
                ctx.fill();

                star.y -= star.speed;
                if (star.y < -5) {
                    star.y = canvas.height + 5;
                    star.x = Math.random() * canvas.width;
                }
            });

            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', () => { resize(); init(); });
        resize();
        init();
        draw();
    }

    function initHolographicTilt() {
        const frame = document.querySelector('.image-frame');
        if (!frame) return;
        frame.addEventListener('mousemove', (e) => {
            const rect = frame.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            frame.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
        });
        frame.addEventListener('mouseleave', () => {
            frame.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
        });
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

        // Theme
        applyTheme(chapter.id);

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
            const avatarImg = charData.avatar
                ? `<img class="char-avatar" src="${charData.avatar}" alt="${charData.name}" onerror="this.style.display='none'">`
                : `<div class="char-avatar" style="background:linear-gradient(135deg,${charData.color},#1e293b);display:flex;align-items:center;justify-content:center;font-weight:700;color:white;text-shadow:0 0 4px rgba(0,0,0,0.5);">${charData.name.charAt(0)}</div>`;
            const speakBtn = typeof window.speakDialogue === 'function' ? `<button class="speak-btn" onclick="window.speakDialogue('${block.text.replace(/'/g, "\\'").replace(/\n/g, ' ')}', this)" title="Read aloud">&#9654;</button>` : '';
            const isEntity = block.char === 'entity';
            if (isEntity) el.classList.add('entity-dialogue');
            el.innerHTML = `
                <div class="dialogue-header" style="--char-color: ${charData.color}">
                    ${avatarImg}
                    <span class="char-name">${charData.name}${speakBtn}</span>
                    ${block.emotion ? `<span class="emotion-tag">${block.emotion}</span>` : ''}
                </div>
                <div class="dialogue-text ${isEntity ? 'glitch-text' : ''}" ${isEntity ? `data-text="${escapeHtml(block.text)}"` : ''}></div>
            `;
            dom.storyContent.appendChild(el);
            decryptTypewrite(el.querySelector('.dialogue-text'), block.text, () => {
                setTimeout(() => renderContentBlocks(blocks, index + 1), 400);
            });
        } else if (block.type === 'narration') {
            el.innerHTML = `<div class="narration-text"></div>`;
            dom.storyContent.appendChild(el);
            decryptTypewrite(el.querySelector('.narration-text'), block.text, () => {
                setTimeout(() => renderContentBlocks(blocks, index + 1), 300);
            });
        } else {
            el.textContent = block.text || '';
            dom.storyContent.appendChild(el);
            renderContentBlocks(blocks, index + 1);
        }

        dom.storyContent.scrollTop = dom.storyContent.scrollHeight;
    }

    function decryptTypewrite(element, text, callback) {
        clearTypewriter();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let resolved = 0;
        const total = text.length;
        const speed = 22;

        element.classList.add('decrypting');
        typewriterInterval = setInterval(() => {
            element.textContent = text.split('').map((char, index) => {
                if (char === ' ' || char === '\n' || char === '!' || char === '.' || char === ',' || char === '"' || char === "'") {
                    if (index < resolved) return char;
                    return char;
                }
                if (index < resolved) return char;
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');

            dom.storyContent.scrollTop = dom.storyContent.scrollHeight;

            if (Math.random() > 0.35) resolved++;

            if (resolved >= total) {
                element.textContent = text;
                element.classList.remove('decrypting');
                clearInterval(typewriterInterval);
                typewriterInterval = null;
                if (callback) callback();
            }
        }, speed);
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
        const tierLabels = {
            gold: '★ GOLD ENDING ★',
            silver: '☆ SILVER ENDING ☆',
            bronze: '● BRONZE ENDING ●'
        };
        const tierDesc = {
            gold: 'You found the best possible outcome. Humanity and the entity thrive together.',
            silver: 'A difficult path with meaningful sacrifice. The future is uncertain but hopeful.',
            bronze: 'Survival at a cost. Some doors, once closed, never open again.'
        };
        const badge = document.createElement('div');
        badge.className = `ending-badge ${tier}`;
        badge.innerHTML = `
            <div class="badge-glow"></div>
            <div class="badge-content">
                <h2>${tierLabels[tier] || tier.toUpperCase() + ' ENDING'}</h2>
                <p>${tierDesc[tier] || 'The story concludes.'}</p>
                <p style="font-size:0.75rem;margin-top:12px;opacity:0.6">Unlocked ${new Date().toLocaleDateString()} • ${Object.keys(GlacierState.get().endingsSeen || {}).length || 0} endings discovered</p>
                <p style="font-size:0.8rem;margin-top:16px;opacity:0.8;font-style:italic;">Reset from the menu to explore other branches</p>
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
            loadAndRender('ch1-ice-frontier');
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
