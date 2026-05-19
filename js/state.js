/**
 * GLACIER STATE MANAGER
 * Persistent stateful branching with localStorage
 */
const GlacierState = (function() {
    const SAVE_KEY = 'glacier_moon_save_v2';

    // Default state schema
    const defaults = {
        currentChapter: 'ch1-landing',
        history: [],           // Array of {chapter, choiceId, timestamp}
        flags: {},             // Boolean story flags
        stats: {               // Numeric relationship/attribute scores
            courage: 0,
            tech: 0,
            leadership: 0,
            kaelTrust: 0,
            elaraTrust: 0,
            nyxTrust: 0,
            vaneTrust: 0,
            alienAffinity: 0
        },
        inventory: [],         // Acquired items
        visited: new Set(),    // Visited chapter IDs
        deaths: 0,
        playTime: 0,
        startDate: null,
        endingsSeen: new Set(),
        // Branching persistence
        worldState: {          // Global world changes
            reactorFixed: false,
            aliensContacted: false,
            outpostDefenses: 50,
            crewMorale: 50,
            kaelAlive: true,
            elaraAlive: true,
            nyxAlive: true,
            vaneAlive: true
        }
    };

    let state = load() || deepClone(defaults);
    if (!state.startDate) state.startDate = Date.now();

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj, (key, val) => {
            if (val instanceof Set) return { __type: 'Set', data: [...val] };
            return val;
        }), (key, val) => {
            if (val && val.__type === 'Set') return new Set(val.data);
            return val;
        });
    }

    function load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            // Restore Sets
            if (parsed.visited && parsed.visited.data) parsed.visited = new Set(parsed.visited.data);
            if (parsed.endingsSeen && parsed.endingsSeen.data) parsed.endingsSeen = new Set(parsed.endingsSeen.data);
            else if (Array.isArray(parsed.endingsSeen)) parsed.endingsSeen = new Set(parsed.endingsSeen);
            return parsed;
        } catch (e) {
            console.warn('Failed to load save:', e);
            return null;
        }
    }

    function save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    }

    function reset() {
        state = deepClone(defaults);
        state.startDate = Date.now();
        localStorage.removeItem(SAVE_KEY);
    }

    // Public API
    return {
        get: () => state,

        visitChapter: (id) => {
            state.visited.add(id);
            save();
        },

        makeChoice: (chapterId, choice) => {
            // Record history
            state.history.push({
                chapter: chapterId,
                choiceId: choice.id,
                choiceText: choice.text,
                timestamp: Date.now()
            });

            // Apply effects
            if (choice.effects) {
                Object.entries(choice.effects).forEach(([key, val]) => {
                    if (key in state.stats) state.stats[key] += val;
                    else if (key in state.worldState) {
                        if (typeof state.worldState[key] === 'number') state.worldState[key] += val;
                        else if (typeof state.worldState[key] === 'boolean') state.worldState[key] = !!val;
                    }
                    else state.flags[key] = val;
                });
            }

            // Inventory
            if (choice.giveItem) {
                if (!state.inventory.includes(choice.giveItem)) {
                    state.inventory.push(choice.giveItem);
                }
            }
            if (choice.removeItem) {
                state.inventory = state.inventory.filter(i => i !== choice.removeItem);
            }

            // Move to next chapter
            if (choice.target) {
                state.currentChapter = choice.target;
            }

            save();
            return state.currentChapter;
        },

        checkCondition: (condition) => {
            if (!condition) return true;
            // Simple flag check: { flag: true } or { stat: { courage: 2 } }
            // Also supports: { hasItem: 'keycard' }, { worldState: { reactorFixed: true } }
            if (condition.flag !== undefined) return !!state.flags[condition.flag];
            if (condition.notFlag !== undefined) return !state.flags[condition.notFlag];
            if (condition.hasItem) return state.inventory.includes(condition.hasItem);
            if (condition.missingItem) return !state.inventory.includes(condition.missingItem);
            if (condition.stat) {
                return Object.entries(condition.stat).every(([k, v]) => (state.stats[k] || 0) >= v);
            }
            if (condition.worldState) {
                return Object.entries(condition.worldState).every(([k, v]) => state.worldState[k] === v);
            }
            if (condition.visited) return state.visited.has(condition.visited);
            return true;
        },

        recordEnding: (endingId) => {
            state.endingsSeen.add(endingId);
            save();
        },

        getPlayTime: () => {
            return Math.floor((Date.now() - state.startDate) / 1000) + state.playTime;
        },

        reset,
        save,
        export: () => btoa(JSON.stringify(state)),
        import: (str) => {
            try {
                state = JSON.parse(atob(str));
                save();
                return true;
            } catch (e) { return false; }
        }
    };
})();
