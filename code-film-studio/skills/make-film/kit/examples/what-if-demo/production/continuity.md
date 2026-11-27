# Cast & Continuity Ledger

## Cast (`scenes/cast.js` — MC v2 House Rig)
- `host` — Cream coat (`#f6efdd`), `#eea865` rim, calm curious presenter
- `friend` — Sage cardigan (`#cfe3c8`) over cream shirt, deadpan skeptic
- `scientist` — Sky labcoat (`#bcd7ee`) over peach shirt + glasses, holds seismometer tablet locked via `handPos(opts, 'B')`

## Continuity Table
| Shot | Location | Characters & Screen Side | Props | Light Dir | Exit -> Next |
|------|----------|--------------------------|-------|-----------|--------------|
| `s01` | `plaza` (dusk) | `host` left (`0.43W`), `friend` right (`0.57W`) | none | `[1, -0.32]` | Cut in to `friend` reaction |
| `s02` | `plaza` (dusk) | `friend` close-up (`facing: -1`, matches `s01`!) | none | `[1, -0.32]` | Cut to lab analysis |
| `s03` | `interiorLab` | `scientist` left (`0.36W`, `facing: 1`), `dataCard` right | Tablet on `handPos('B')` | `[-1, -0.30]` | Cut back to plaza jump |
| `s04` | `plaza` (dusk) | Crowd (`0.85` depth) + `host` & `friend` foreground | none | `[1, -0.32]` | Dissolve to blueprint |
| `s05` | `blueprint` | Schematic bars + Earth orbit diagram | none | UI light | Dissolve to calm plaza hold |
| `s06` | `plaza` (dusk) | `host` & `friend` settled (`hold: true`) | none | `[1, -0.32]` | Fade to black |
