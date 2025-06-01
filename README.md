# tscircuit Schematic Layout Editor

This schematic editor is used to create reference layouts for the tscircuit schematic layout "match-adapt" algorithm. This algorithm works by matching a user's netlist against a known corpus of schematic designs.

[![image](https://github.com/user-attachments/assets/9f26273d-95dc-4677-94d2-e04be50d726d)](https://schematic-layout-editor.tscircuit.com)

[Try it out!](https://schematic-layout-editor.tscircuit.com)

You can download your schematic layout as JSON from this page and hit the "cloud upload" icon to upload it to the project's corpus. After approval on GitHub, tscircuit will automatically incorporate your design into automatic schematic layout.

There are 5 key elements in a schematic layout:

- A **Chip** is a box with pins on the top, left, right or bottom.
- A **Passive** (actually any two-pin component) has two pins and can be rotated.
- A **Connection** is a line between any two pins.
- A **Net Label** is used to indicate anything with that net label is implicitly connected.
- A **Junction** is a point on a line that branches off to another pin.

You can read more about the schematic-match-adapt algorithm here: [GitHub](https://github.com/tscircuit/schematic-match-adapt)
