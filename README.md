# Workshop — Unified `Skill` (`Code Film Studio v2.1.0`)

A single, drop-in **universal agent skill (`Skill/` & `Skill.zip`)** that turns any coding agent (Claude, Qwen, Cursor, Codex, OpenCode) into an autonomous **2D / 2.5D / 3D animated film & video production studio**:

1. **Autonomous 7-Gate Studio Crew** (`Skill/references/production-roles.md`) — Showrunner, Writer, Art Director, Cinematographer, Sound Designer, and Critic roles that take a plain prompt, script, dialogue, or voiceover all the way to a finished `1080p` MP4.
2. **Parameterized `MC v2` Character Rig** (`Skill/kit/engine/rig2d.js` & `three-kit.js`) — dark circular head with razor crescent rim light, vertical cream eyes, expressive pill brow bars, shaded rounded coats (`COATS` + `cardigan`, `labcoat`, `hoodie`, `suit`, `elder`), crisp limbs, ball hands, flat feet, and exact `handPos()` prop sockets.
3. **Dual-Backend Engine & Live Screening Room** (`Skill/kit/render.mjs` & `serve.mjs`) — Canvas2D + Three.js WebGL via Playwright Chromium or headless Node `@napi-rs/canvas` streaming lossless raw RGBA straight to FFmpeg, plus a zero-dependency HTTP `206` Screening Room server.
4. **9 Universal Visual Styles** (`awaken`, `daylight`, `cinema`, `noir`, `emerald`, `ember`, `arctic`, `sakura`, `retro`) in both `16:9` and `9:16`.
5. **Procedural Music, 35+ Foley SFX & Two-Pass Mastering** (`Skill/kit/audio/`) — mood-sectioned score, loopable ambiences, 35+ Foley/UI cues, automatic speech ducking, `.srt/.vtt` subtitles, and two-pass `-14 / -16 LUFS` loudness normalization.
6. **Streaming Frame-Decoded QA** (`Skill/kit/tools/qa.py`) — `O(1)` memory full-video frame & loudness verification + 8-category Critic Rubric.

---

## How to Attach & Use `Skill`

### 1. Attach `Skill` to Your Agent
- **Claude.ai / Claude Desktop / Web Agent Uploaders ("Upload Skill"):**
  Upload **`Skill.zip`** directly in **Settings -> Capabilities -> Skills -> Upload skill**.
- **Claude Code / Qwen-Code / Local CLI Agents (Skills Folder):**
  Copy **`Skill/`** into your agent's skills directory:
  ```bash
  # Claude Code:
  mkdir -p ~/.claude/skills && cp -R Skill ~/.claude/skills/code-film-studio

  # Qwen / Codex / Generic .agents skills directory:
  mkdir -p .agents/skills && cp -R Skill .agents/skills/code-film-studio
  ```
- **Direct Chat Attachment (Any Coding Agent — Qwen, Claude, Cursor, Windsurf):**
  Place the **`Skill/`** folder in your workspace and attach or mention `@Skill/SKILL.md`.

### 2. Just Type What Video You Want
Once attached, you do **not** need to run scripts manually—just tell the agent what video you want:
- *"Make a 45-second 16:9 animated video explaining why airplanes don't flap their wings."*
- *"Turn `./my_voiceover.mp3` into a 9:16 vertical short in `arctic` style with subtitles."*
- *"Make a 60-second two-character comedy from `./script.md` in `daylight` style."*

The agent automatically bootstraps any missing Python/Canvas packages (`doctor.py`), writes the script & storyboard, animates the `MC v2` cast & multi-plane sets, mixes the music + Foley SFX to `-14 LUFS`, renders `<project>/exports/final.mp4`, and runs `qa.py` before handing you the finished video.

---

## Grab Only `Skill` From GitHub

```bash
git clone --filter=blob:none --no-checkout https://github.com/AsuraXP/Workshop.git
cd Workshop
git sparse-checkout init --cone
git sparse-checkout set Skill
git checkout
```

---

## Verification & Packaging

```bash
python3 tests/pack_skill.py
node --test tests/test_engine.mjs
python3 tests/test_studio_tools.py
```
