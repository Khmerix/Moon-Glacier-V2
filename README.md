# 🌙 Glacier Moon V2

Interactive sci-fi branching narrative built with a modular markdown-driven engine.

## Quick Start

**You must run a local server** — opening `index.html` directly in a browser will not work due to CORS restrictions on fetched chapter files.

### Windows
Double-click `start-server.bat` or run:
```bash
python -m http.server 8000 --bind 127.0.0.1
```

### macOS / Linux
```bash
./start-server.sh
```

Then open **http://localhost:8000** in your browser.

## Features

- 📝 **Markdown chapters** — write story content in `.md` files with frontmatter
- 🎨 **Per-chapter sci-fi themes** — CRT scanlines, film noise, parallax starfield, chromatic aberration
- 🔊 **Text-to-speech** — click ▶ on any dialogue to hear it read aloud
- 🎵 **Ambient audio** — toggle atmospheric drone in the bottom-right corner
- 💾 **Save system** — export/import save codes or auto-save to localStorage
- 🎮 **Branching choices** — choices affect stats, inventory, and story outcomes

## Project Structure

```
Moon-Glacier V2/
├── index.html              # Shell page + HUD layout
├── start-server.bat        # Windows launcher
├── start-server.sh         # macOS/Linux launcher
├── css/
│   └── glacier.css         # Sci-fi theme, CRT effects, chapter themes
├── js/
│   ├── state.js            # Save/load, stats, inventory, branching state
│   ├── parser.js           # Markdown chapter parser
│   └── engine.js           # Renderer, typewriter, starfield, HUD
├── chapters/
│   ├── ch1-ice-frontier.md
│   ├── ch2-cold-silence.md
│   ├── ch3-deep-vein.md
│   ├── ch4-first-contact.md
│   └── ch5-awakening.md
└── visuals/
    ├── ch1-5/              # Chapter scene images
    └── chars/              # Character portraits
```

## Writing Chapters

Chapters use YAML frontmatter + blockquoted narrative:

```markdown
---
id: ch1-example
title: "Chapter Title"
location: "Location Name"
time: "Cycle 1, Hour 0"
image: visuals/ch1/scene.png
type: story
---

> **NARRATION**
> The transport shuddered as it breached the atmosphere.

> **DIALOGUE: Commander Vance** *determined*
> "We land now. No turning back."

## Choices

- **Order emergency descent** → ch2-next
  *Effects: courage +1*
  *Flavor: The ship drops like a stone.*
```

## License

MIT — see [LICENSE](LICENSE)
