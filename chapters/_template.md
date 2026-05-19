---
id: ch{NUMBER}-{NAME}
title: "Chapter {NUMBER}: {TITLE}"
location: "Sector Name"
time: "Cycle X, Hour Y"
image: visuals/ch{NUMBER}/scene.jpg
type: story
---

> **NARRATION**
> Describe the scene, action, or environment here. This is where you set the mood.
> Use multiple paragraphs to build atmosphere.

> **DIALOGUE: Character Name** *emotion*
> "Spoken dialogue goes in double quotes."
> "You can have multiple paragraphs of dialogue."

> **NARRATION**
> Back to descriptive text. Build tension. Reveal information.

> **DIALOGUE: Another Character** *whispered*
> "Emotion tags are optional but add flavor."

> **SYSTEM** *alert*
> "Computer or AI messages use the SYSTEM block type."

> **NARRATION**
> End the chapter on a decision point. The player should feel the weight of what comes next.

## Choices

- **Choice A: The safe path** → target-chapter-id-a
  *Effects: statName +1, anotherStat +2*
  *Flavor: Brief description of what this choice implies.*

- **Choice B: The risky path** → target-chapter-id-b
  *Effects: courage +2, statName -1*
  *Condition: stat courage >= 1*
  *Flavor: This choice only appears if the player has enough courage.*

- **Choice C: The clever path** → target-chapter-id-c
  *Effects: tech +3*
  *Give: useful-item*
  *Flavor: Grants an item that may unlock future options.*

## World Update
# Optional: Changes to global state when this chapter is visited
# reactorFixed: true
# aliensContacted: false
# outpostDefenses: 50

---

## 📝 Quick Reference

### Block Types
| Syntax | Purpose |
|--------|---------|
| `> **NARRATION**` | Descriptive text |
| `> **DIALOGUE: Name** *emotion*` | Character speech |
| `> **SYSTEM**` | Computer/AI messages |

### Choice Fields
| Field | Format | Example |
|-------|--------|---------|
| Text | `- **Text** → target` | `- **Run away** → ch3-escape` |
| Effects | `*Effects: stat +N*` | `*Effects: courage +2*` |
| Condition | `*Condition: type requirement*` | `*Condition: stat courage >= 2*` |
| Flavor | `*Flavor: description*` | `*Flavor: Dangerous but brave.*` |
| Give Item | `*Give: item-name*` | `*Give: keycard*` |
| Remove Item | `*Remove: item-name*` | `*Remove: broken-radio*` |

### Condition Types
- `stat courage >= 2` — Stat threshold
- `hasItem keycard` — Inventory check
- `worldState reactorFixed true` — World state check
- `flag met-entity` — Story flag check

### Tips
- Keep chapters focused on ONE scene or decision point
- End every chapter on a choice (except endings)
- Use emotion tags to guide voice acting (if added later)
- Reference lore files in `/lore/` for consistency
- Test your chapter by opening `index.html` in a browser
