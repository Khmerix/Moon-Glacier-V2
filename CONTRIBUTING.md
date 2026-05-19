# Contributing to Glacier Moon Outpost

Thank you for helping build this universe! This guide covers how to write chapters, expand lore, and submit your work.

---

## 🚀 Quick Start

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create a branch**: `git checkout -b my-contribution`
4. **Edit files** (see formats below)
5. **Test** by opening `index.html` in your browser
6. **Commit** and **Push**
7. **Open a Pull Request** with a descriptive title using the tags below

---

## 🏷️ Pull Request Tags

Prefix your PR title with one of these:

| Tag | Purpose |
|-----|---------|
| `[chapter]` | New chapter or edits to existing chapters |
| `[lore]` | World-building: characters, technology, alien species, history |
| `[visual]` | Images, concept art, UI design, CSS improvements |
| `[alt]` | Alternate timelines, non-canon explorations, "what if" stories |
| `[engine]` | JavaScript parser, renderer, save system improvements |
| `[fix]` | Bug fixes, typo corrections, broken links |

**Example PR title:** `[chapter] Add Chapter 6: The Deep Council`

---

## 📝 Writing Chapters

### File Location

Place new chapters in `/chapters/` as `.md` files.

**Naming:** Use the pattern `ch{number}-{short-name}.md`  
**Example:** `ch6-deep-council.md`

### Required Frontmatter

Every chapter needs YAML frontmatter between `---` lines:

```yaml
---
id: ch6-deep-council          # Unique ID, used for linking
title: "Chapter 6: The Deep Council"  # Display title
location: "Subglacial Depth 4km"      # Where the scene happens
time: "Cycle 1, Hour 14"               # Story timestamp
image: visuals/ch6/council.jpg         # Background image path
type: story                            # story | ending | epilogue
---
```

### Writing Narrative

Use blockquotes (`>`) for all story content:

```markdown
> **NARRATION**
> Describe the scene, action, or environment.
>
> **DIALOGUE: Character Name** *emotion*
> "Spoken dialogue goes in quotes."
>
> **DIALOGUE: System** *warning*
> "Computer/system messages."
```

**Supported block types:**
- `**NARRATION**` — Descriptive text
- `**DIALOGUE: Name** *emotion*` — Character speech with optional emotion tag
- `**SYSTEM**` — Computer/AI messages

### Adding Choices

Add a `## Choices` section at the end:

```markdown
## Choices

- **What the player sees** → target-chapter-id
  *Effects: courage +1, kaelTrust -1*
  *Condition: stat courage >= 2*
  *Flavor: Optional description shown on hover.*
  *Give: item-name*
  *Remove: old-item*
```

**Choice fields:**
- `**Text** → target-id` — Button label and destination chapter (required)
- `*Effects: stat +N*` — Stat changes applied when chosen
- `*Condition: ...*` — Hide choice unless condition is met
- `*Flavor: ...*` — Extra context/description
- `*Give: item*` — Add item to inventory
- `*Remove: item*` — Remove item from inventory

### Conditions

Choices can be hidden based on player history:

```markdown
*Condition: stat courage >= 2*        # Requires courage stat
*Condition: hasItem beacon-data*      # Requires inventory item
*Condition: worldState reactorFixed true*  # Requires world state
*Condition: flag met-entity*           # Requires story flag
```

### World Updates

Some chapters change the global state:

```markdown
## World Update
reactorFixed: true
aliensContacted: true
outpostDefenses: 25
```

---

## 🌍 Expanding Lore

Lore files live in `/lore/` as Markdown documents. No special format required—just well-organized information.

**Existing lore areas:**
- `world.md` — Planet geography, timeline, key regions
- `alien-species.md` — The Resonant, their biology, communication
- `technology.md` — Human and alien equipment
- `characters.md` — Character bios, arcs, relationships

**Add new lore files freely.** The engine doesn't parse them—they're for contributors to reference.

---

## 🎨 Visuals

Place images in `/visuals/` organized by chapter:

```
visuals/
├── ch1/
│   └── glacier-descent.jpg
├── ch2/
│   └── landing-pad.jpg
└── chars/
    └── voss.png
```

**Image guidelines:**
- Use `.jpg` for backgrounds, `.png` for characters with transparency
- Recommended: 1920×1080 for backgrounds, 400×400 for character portraits
- Optimize for web (compress to <500KB each)

---

## 🌌 Alternate Timelines

Want to explore "what if" scenarios? Place them in `/contributions/`:

```
contributions/
└── alt-what-if-voss-died.md
```

These are **not canon** unless merged into `/chapters/` by a maintainer. Experiment freely.

---

## ✅ Review Checklist

Before submitting:

- [ ] Chapter ID is unique
- [ ] All `→ target-chapter-id` links exist (or are marked `[TODO]`)
- [ ] Images referenced in frontmatter exist in `/visuals/`
- [ ] Tested by opening `index.html` and navigating to your chapter
- [ ] No JavaScript edits needed (if you only edited Markdown)
- [ ] PR title has the correct tag prefix

---

## 💬 Questions?

Open an **Issue** with the `[question]` tag. The community will help.

**Happy world-building.** The ice is listening.
