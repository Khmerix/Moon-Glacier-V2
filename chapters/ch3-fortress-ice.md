---
id: ch3-fortress-ice
title: "Fortress Ice"
location: "Outpost Erebus — Command Center"
time: "Cycle 1, Hour 5"
image: visuals/ch3/command-bunker.png
type: story
---

> **NARRATION**
> The command center was a tomb. Screens flickered with half-dead diagnostics, and the air smelled of ozone and something older—something that had no name in any human language.

> **NARRATION**
> Marcus worked fast, rerouting power, sealing bulkheads. He was too fast, Kael noticed. Too practiced. As if he'd done this before.

> **NARRATION**
> "Commander," Marcus said, not looking up from the terminal. "You need to see this."

> **NARRATION**
> The screen showed a hidden sub-level—Level 9—not on any official schematic. And someone had been there. Recently.

> **DIALOGUE: Elara Synn** *suspicious*
> "These access logs... they're encrypted with Helix Corp protocols. Marcus, why does a UN outpost have corporate encryption?"

> **NARRATION**
> Marcus stood slowly. His hand drifted toward his sidearm. The temperature in the room seemed to drop ten degrees.

> **DIALOGUE: Marcus Thorne** *cold*
> "Because this outpost was never UN, Elara. It was Helix. And I'm not an engineer. I'm an acquisition specialist."

> **NARRATION**
> The gun came up. Not at the entity. At Kael.

> **DIALOGUE: Marcus Thorne** *grim*
> "The alien tech down there is worth more than every human life on this rock. Step aside, Commander. I don't want to shoot you. But I will."

## Choices

- **Disarm Marcus before he fires** → ch4-betrayal
  *Effects: courage +2*
  *Condition: { stat: { courage: 2 } }*
  *Flavor: Loyalty has a price. Today, it bleeds.*

- **Investigate the sealed sub-level** → ch3-fenwick
  *Effects: elaraTrust +1, courage +1*
  *Flavor: Some doors are sealed for a reason. Some reasons are hungry.*

- **Let him go and track him** → ch4-corporate-raid
  *Effects: leadership +2, marcusTrust -3*
  *Flavor: A live traitor is worth more than a dead one. For now.*
