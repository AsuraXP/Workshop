# Mini render smoke test

Three hand-authored, code-drawn 2D panels. This is a silent renderer example (not a complete narrated film); a production project uses a Brian Edge TTS narration, word timings, and a voice-forward mix.

From the repository root, after `npm install` in `InkExplainerSkill/`:

```bash
node InkExplainerSkill/kit/render.mjs --project InkExplainerSkill/examples/mini-demo --no-audio --sheet
```

The MP4 and contact sheet are written under this example's ignored `exports/` folder.
