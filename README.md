# Workshop — Awaken Sparse-Voice Film `Skill` (`v3.0`)

A focused, zero-bloat **Awaken-style animated film skill (`Skill/` & `Skill.zip`)** for Claude, Qwen, Cursor, Codex, and OpenCode.

Instead of generating wall-to-wall YouTube essay narration, this skill enforces **visual-first cinema**:
- **60–70% of every film** is carried by **`MC v2` character acting, multi-plane camera motion, Foley sound effects, and swelling music**.
- **30–40% max** is sparse, high-impact speech (`<= 12–14 words` per cue, enforced automatically by `tts.py` and `qa.py`) using **`Brian`** (`edge-tts`) for male voices and **`af_heart`** (`Kokoro`) for female voices.
- Supports both **`16:9` widescreen** *(default)* and **`9:16` vertical** (`@vertical`), plus automatic **AI + Code Thumbnails**.

---

## 1. Attach `Skill` to Your Agent

### Grab Only `Skill` From GitHub
```bash
git clone --filter=blob:none --no-checkout https://github.com/AsuraXP/Workshop.git
cd Workshop
git sparse-checkout init --cone
git sparse-checkout set Skill
git checkout
```

### Load It
- **Upload ZIP (Claude.ai / Desktop / Web Agent Builders):** Upload **`Skill.zip`**.
- **Claude Code CLI:** `mkdir -p ~/.claude/skills && cp -R Skill ~/.claude/skills/awaken-film-studio`
- **Qwen / Codex / Cursor / OpenCode:** `mkdir -p .agents/skills && cp -R Skill .agents/skills/awaken-film-studio` *(or mention `@Skill/SKILL.md` in chat)*.

---

## 2. How to Use It (Just Describe Your Idea!)

No format bloat needed—every prompt automatically builds a sparse-voice Awaken film:

- **Default (`16:9` Awaken Twilight, `Brian` + `af_heart` sparse cast + Thumbnail):**
  > `Make a 60s video about why time actually runs slightly slower at your feet than at your head.`

- **Vertical `9:16` Cut (`@vertical`):**
  > `@vertical Make a 45s film about what happens in the quiet space between two neurons firing.`

- **World Color Moods (Optional `@<palette>`):**
  - `@awaken` *(default warm twilight)* · `@noir` *(midnight mystery)* · `@arctic` *(deep ice-cyan science/space)* · `@cinema` *(slate & ember drama)* · `@daylight` *(bright outdoor)* · `@emerald` · `@ember` · `@sakura` · `@retro`

- **Voice & Workflow Tags (Optional):**
  - *(default)*: `Brian` (`edge-tts`) + `af_heart` (`Kokoro`) sparse duo
  - `@voice:male`: solo `Brian` (`edge-tts`) · `@voice:female`: solo `af_heart` (`Kokoro`) · `@voice:auto`: casts character-matched male (`edge-tts`) & female (`Kokoro`) voices · `@silent`: zero speech, 100% music + Foley
  - `@thumb` *(default AI+code thumbnail)* · `@thumb:code` · `@no-thumb` · `@pause` *(preview script + 9-style sheet before rendering)*

---

## 3. Lean Skill Structure (`Skill/`)

- `Skill/SKILL.md` — Focused 7-gate Awaken director specification (`~90` lines)
- `Skill/references/` — **4 tight manuals** (`awaken-direction.md`, `engine-and-rig.md`, `voice-and-sound.md`, `qa-and-thumbnail.md`)
- `Skill/kit/engine/` — `MC v2` 2D/3D rig (`rig2d.js`, `three-kit.js`), `core.js`, `styles.js`, `fx2d.js`, `ui2d.js`, `compositor.js`
- `Skill/kit/audio/` — `tts.py` (`Brian` + `af_heart` + sparse-voice check), `music.py`, `sfx.py` (`35+` Foley cues), `mix.py` (two-pass `-14/-16 LUFS` + `speech_ratio`)
- `Skill/kit/tools/` — `new_project.py`, `plan_timeline.py`, `export_srt.py`, `thumbnail.py`, `qa.py`, `doctor.py`, `verify_kit.py`
- `Skill/kit/{render.mjs,serve.mjs,player.html}` — Lossless RGBA -> FFmpeg renderer & HTTP `206` live Screening Room

---

## Verification & Packaging

```bash
python3 tests/pack_skill.py
node --test tests/test_engine.mjs
python3 tests/test_studio_tools.py
```
