#!/usr/bin/env python3
"""Automated test suite for Code Film Studio Python tools, audio DSP/loudnorm, QA, and zero-conflict skill docs."""
import json, os, re, shutil, subprocess, sys, tempfile, time, unittest, urllib.request, zipfile
from pathlib import Path

STUDIO_ROOT = Path(__file__).resolve().parent.parent
SKILL_DIR = STUDIO_ROOT / "Skill"
KIT = SKILL_DIR / "kit"
PY = sys.executable


def run_cmd(cmd, cwd=STUDIO_ROOT, env=None):
    merged_env = os.environ.copy()
    merged_env["PYTHON_BIN"] = PY
    if env:
        merged_env.update(env)
    return subprocess.run(cmd, cwd=cwd, env=merged_env, capture_output=True, text=True, check=True)


class CodeFilmStudioTests(unittest.TestCase):
    def test_01_kit_integrity_and_no_skill_conflicts(self):
        r = run_cmd([PY, str(KIT / "tools/verify_kit.py")])
        self.assertIn("Kit integrity verified", r.stdout)

        # Ensure all 5 SKILL.md files exist and reference valid style IDs matching styles.js
        styles_block = (KIT / "engine/styles.js").read_text("utf-8").split("export const STYLES = {")[1]
        style_ids = set(re.findall(r"^\s{2}([a-z]+):\s*\{", styles_block, flags=re.MULTILINE))
        expected_styles = {"awaken", "daylight", "cinema", "noir", "emerald", "ember", "arctic", "sakura", "retro"}
        self.assertEqual(style_ids, expected_styles)

        sk_md = SKILL_DIR / "SKILL.md"
        self.assertTrue(sk_md.exists(), f"Missing {sk_md}")
        txt = sk_md.read_text("utf-8")
        # Zero leftover stale style names from legacy GrowKaz (neon/paper/dusk) or CairoSVG studio imports
        self.assertNotIn("cairosvg", txt.lower())
        self.assertNotIn("--style neon", txt)
        self.assertNotIn("--style paper", txt)

    def test_02_new_project_and_plan_timeline_modes(self):
        with tempfile.TemporaryDirectory() as tmp:
            p_script = Path(tmp) / "script_film"
            script_file = Path(tmp) / "story.md"
            script_file.write_text(
                "# Test Short\n"
                "Imagine two people alone on a quiet twilight hill.\n"
                "FRIEND: Wait... is it really just the two of us?\n"
                "[SILENT 2.0s] Both look out over the glowing valley.\n",
                "utf-8",
            )
            run_cmd([PY, str(KIT / "tools/new_project.py"), str(p_script), "--title", "Quiet Hill", "--script", str(script_file)])
            self.assertTrue((p_script / "production/brief.md").exists())
            self.assertTrue((p_script / "production/continuity.md").exists())
            cfg = json.loads((p_script / "config.json").read_text("utf-8"))
            self.assertIsNone(cfg["voiceover"])
            self.assertEqual(cfg["style"], "awaken")
            self.assertEqual(cfg["bars"], "none")

            run_cmd([PY, str(KIT / "tools/plan_timeline.py"), "--project", str(p_script), "--write-shots"])
            shots = json.loads((p_script / "story/shots.json").read_text("utf-8"))["shots"]
            self.assertEqual(len(shots), 3)
            self.assertEqual(shots[1]["speaker"], "FRIEND")

            run_cmd([PY, str(KIT / "tools/export_srt.py"), "--project", str(p_script), "--vtt"])
            srt = (p_script / "exports/subtitles.srt").read_text("utf-8")
            self.assertIn("FRIEND: Wait...", srt)
            self.assertTrue((p_script / "exports/subtitles.vtt").exists())

            # Test BPM musical beat-grid mode
            p_bpm = Path(tmp) / "bpm_film"
            run_cmd([PY, str(KIT / "tools/new_project.py"), str(p_bpm), "--title", "Beat Film", "--duration", "16"])
            run_cmd([PY, str(KIT / "tools/plan_timeline.py"), "--project", str(p_bpm), "--bpm", "120", "--beats-per-shot", "8", "--duration", "16", "--write-shots"])
            bpm_shots = json.loads((p_bpm / "story/shots.json").read_text("utf-8"))["shots"]
            self.assertEqual(len(bpm_shots), 4)
            self.assertAlmostEqual(bpm_shots[0]["dur"], 4.0, places=2)

    def test_03_audio_mix_two_pass_loudnorm_and_full_render_qa(self):
        with tempfile.TemporaryDirectory() as tmp:
            demo = Path(tmp) / "what-if"
            shutil.copytree(KIT / "examples/what-if-demo", demo)

            # 1. Audio mix without voiceover -> hits ~ -14 LUFS via two-pass loudnorm
            run_cmd([PY, str(KIT / "audio/mix.py"), "--project", str(demo)])
            self.assertTrue((demo / "build/mix.wav").exists())

            # 2. Render preview MP4 into default exports/preview.mp4 and run full frame-decoded QA
            run_cmd(["node", str(KIT / "render.mjs"), "--project", str(demo), "--preview"])
            self.assertTrue((demo / "exports/preview.mp4").exists())
            qa_res = run_cmd([PY, str(KIT / "tools/qa.py"), "--project", str(demo)])
            report = json.loads((demo / "qa/report.json").read_text("utf-8"))
            self.assertEqual(report["status"], "pass", f"Expected clean QA pass, got: {qa_res.stdout}\n{report}")
            self.assertEqual(report["frames_decoded"], 432)
            self.assertTrue((demo / "qa/overview.jpg").exists())
            self.assertTrue((demo / "qa/s03.jpg").exists())
            self.assertAlmostEqual(report["loudness"]["integrated_lufs"], -14.0, delta=2.0)

            # 3. Verify built-in serve.mjs Screening Room + HTTP 206 Range streaming
            srv = subprocess.Popen(
                ["node", str(KIT / "serve.mjs"), "--project", str(demo), "--port", "0"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            )
            try:
                assert srv.stdout is not None
                line = srv.stdout.readline().strip()
                m = re.search(r":(\d+)\b", line)
                self.assertIsNotNone(m, f"Unexpected serve.mjs banner: {line}")
                port = int(m.group(1))
                html = urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=5).read().decode("utf-8")
                self.assertIn("/__media/video.mp4", html)
                req = urllib.request.Request(f"http://127.0.0.1:{port}/__media/video.mp4", headers={"Range": "bytes=0-63"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    self.assertEqual(resp.status, 206)
                    self.assertEqual(len(resp.read()), 64)
            finally:
                srv.terminate()
                srv.wait(timeout=5)
                if srv.stdout:
                    srv.stdout.close()
                if srv.stderr:
                    srv.stderr.close()

            # 3. Verify qa.py catches an unmarked frozen shot (`hold: false` on s06!)
            shots_path = demo / "story/shots.json"
            shots_doc = json.loads(shots_path.read_text("utf-8"))
            shots_doc["shots"][-1]["hold"] = False
            shots_path.write_text(json.dumps(shots_doc), "utf-8")
            qa_unmarked = run_cmd([PY, str(KIT / "tools/qa.py"), "--project", str(demo)])
            rep2 = json.loads((demo / "qa/report.json").read_text("utf-8"))
            self.assertEqual(rep2["status"], "warn")
            self.assertTrue(any("s06: unintended static freeze" in w for w in rep2["warnings"]))

    def test_04_skill_archive_valid(self):
        skill_zip = STUDIO_ROOT / "Skill.zip"
        self.assertTrue(skill_zip.exists(), "Skill.zip must exist at repo root")
        with zipfile.ZipFile(skill_zip, "r") as zf:
            names = set(zf.namelist())
            self.assertIn("Skill/SKILL.md", names)
            self.assertIn("Skill/kit/serve.mjs", names)
            self.assertIn("Skill/kit/audio/tts.py", names)
            self.assertIn("Skill/kit/tools/thumbnail.py", names)
            self.assertIn("Skill/references/voice-and-thumbnail.md", names)
            self.assertIn("Skill/kit/engine/rig2d.js", names)
            self.assertIn("Skill/kit/tools/qa.py", names)

    def test_05_tts_roster_and_thumbnail_pipeline(self):
        # 1. Verify dual-engine voice roster (Brian via edge-tts + af_heart via Kokoro)
        voices_out = run_cmd([PY, str(KIT / "audio/tts.py"), "--list-voices"]).stdout
        self.assertIn("en-US-BrianMultilingualNeural", voices_out)
        self.assertIn("af_heart", voices_out)

        # 2. Verify speech-bound & internal breath-pause analyzer on a synthetic two-clause WAV
        import numpy as np
        sys.path.insert(0, str(KIT / "audio"))
        from dsp import write_wav
        from tts import analyze_speech_bounds, resolve_voice_spec

        self.assertEqual(resolve_voice_spec("default")["voice_id"], "en-US-BrianMultilingualNeural")
        self.assertEqual(resolve_voice_spec("female")["voice_id"], "af_heart")
        self.assertEqual(resolve_voice_spec("auto", gender_hint="female")["engine"], "kokoro")
        self.assertEqual(resolve_voice_spec("auto", gender_hint="male")["engine"], "edge")

        with tempfile.TemporaryDirectory() as tmp:
            wav_p = Path(tmp) / "two_clause.wav"
            sr = 48000
            t1 = np.sin(2 * np.pi * 220 * np.linspace(0, 0.6, int(0.6 * sr), dtype=np.float32)) * 0.3
            sil_lead = np.zeros(int(0.15 * sr), dtype=np.float32)
            sil_mid = np.zeros(int(0.35 * sr), dtype=np.float32)
            sil_tail = np.zeros(int(0.20 * sr), dtype=np.float32)
            mono = np.concatenate([sil_lead, t1, sil_mid, t1, sil_tail])
            write_wav(wav_p, np.column_stack([mono, mono]))
            bounds = analyze_speech_bounds(wav_p)
            self.assertAlmostEqual(bounds["speech_start"], 0.15, delta=0.03)
            self.assertEqual(len(bounds["pauses"]), 1)
            self.assertAlmostEqual(bounds["pauses"][0][0], 0.75, delta=0.03)
            self.assertAlmostEqual(bounds["pauses"][0][1], 1.10, delta=0.03)

            # 3. Verify thumbnail pipeline (--mode prompt & --mode code)
            demo = Path(tmp) / "thumb_demo"
            shutil.copytree(KIT / "examples/what-if-demo", demo)
            p_res = run_cmd([PY, str(KIT / "tools/thumbnail.py"), "--project", str(demo), "--mode", "prompt", "--hook", "WHAT IF?"])
            self.assertIn("MC v2", p_res.stdout)
            self.assertTrue((demo / "exports/thumbnail_ref.png").exists())
            self.assertTrue((demo / "production/thumbnail_prompt.md").exists())

            run_cmd([PY, str(KIT / "tools/thumbnail.py"), "--project", str(demo), "--mode", "code", "--hook", "WHAT IF?", "--badge", "SHORT FILM"])
            thumb_png = demo / "exports/thumbnail.png"
            thumb_jpg = demo / "exports/thumbnail.jpg"
            self.assertTrue(thumb_png.exists())
            self.assertTrue(thumb_jpg.exists())
            self.assertLess(thumb_jpg.stat().st_size, 2_000_000)

        # 4. Verify README.md & Skill/SKILL.md document all shortcut tags
        readme = (STUDIO_ROOT / "README.md").read_text("utf-8")
        skill_doc = (SKILL_DIR / "SKILL.md").read_text("utf-8")
        for tag in ("[EXPLAINER]", "[2ND-PERSON]", "[STORY]", "[DIALOGUE]", "[MY-VO]", "[SHORT]", "[SILENT]", "@voice:auto", "@thumb"):
            self.assertIn(tag, readme)
            self.assertIn(tag, skill_doc)


if __name__ == "__main__":
    unittest.main(verbosity=2)
