#!/usr/bin/env python3
"""Automated test suite for the focused Awaken Sparse-Voice Film Skill."""
import json, os, re, shutil, subprocess, sys, tempfile, unittest, urllib.request, zipfile
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


class AwakenSkillTests(unittest.TestCase):
    def test_01_lean_kit_integrity_and_no_bloat(self):
        r = run_cmd([PY, str(KIT / "tools/verify_kit.py")])
        self.assertIn("Kit integrity verified", r.stdout)

        # Ensure removed legacy VO-upload bloat tools are gone
        for removed in ("transcribe.py", "beats.py", "parse_script.py"):
            self.assertFalse((KIT / "tools" / removed).exists(), f"{removed} should be removed")

        # Exactly 4 focused reference manuals
        refs = sorted(p.name for p in (SKILL_DIR / "references").glob("*.md"))
        self.assertEqual(refs, ["awaken-direction.md", "engine-and-rig.md", "qa-and-thumbnail.md", "voice-and-sound.md"])

        # Styles match styles.js
        styles_block = (KIT / "engine/styles.js").read_text("utf-8").split("export const STYLES = {")[1]
        style_ids = set(re.findall(r"^\s{2}([a-z]+):\s*\{", styles_block, flags=re.MULTILINE))
        expected_styles = {"awaken", "daylight", "cinema", "noir", "emerald", "ember", "arctic", "sakura", "retro"}
        self.assertEqual(style_ids, expected_styles)

        sk_txt = (SKILL_DIR / "SKILL.md").read_text("utf-8")
        self.assertNotIn("[MY-VO]", sk_txt)
        self.assertNotIn("transcribe.py", sk_txt)
        self.assertIn("@vertical", sk_txt)

    def test_02_new_project_16x9_and_9x16_plus_srt(self):
        with tempfile.TemporaryDirectory() as tmp:
            p_wide = Path(tmp) / "wide_film"
            script_file = Path(tmp) / "story.md"
            script_file.write_text(
                "# Quiet Hill\n"
                "[SILENT 2.0s] Two silhouettes stand on a twilight ridge.\n"
                "FRIEND: Wait... did the city lights just blink?\n"
                "[SILENT 2.5s] Both look out over the valley.\n",
                "utf-8",
            )
            run_cmd([PY, str(KIT / "tools/new_project.py"), str(p_wide), "--title", "Quiet Hill", "--script", str(script_file)])
            cfg = json.loads((p_wide / "config.json").read_text("utf-8"))
            self.assertEqual(cfg["aspect"], "16:9")
            self.assertEqual(cfg["style"], "awaken")

            run_cmd([PY, str(KIT / "tools/plan_timeline.py"), "--project", str(p_wide), "--write-shots"])
            run_cmd([PY, str(KIT / "tools/export_srt.py"), "--project", str(p_wide), "--vtt"])
            srt = (p_wide / "exports/subtitles.srt").read_text("utf-8")
            self.assertIn("FRIEND: Wait...", srt)

            # Also verify 9:16 vertical project scaffolding
            p_vert = Path(tmp) / "vert_film"
            run_cmd([PY, str(KIT / "tools/new_project.py"), str(p_vert), "--title", "Vertical Dusk", "--aspect", "9:16", "--duration", "35"])
            vcfg = json.loads((p_vert / "config.json").read_text("utf-8"))
            self.assertEqual(vcfg["aspect"], "9:16")

    def test_03_mix_speech_ratio_render_serve_and_qa_guardrails(self):
        with tempfile.TemporaryDirectory() as tmp:
            demo = Path(tmp) / "what-if"
            shutil.copytree(KIT / "examples/what-if-demo", demo)

            # 1. Audio mix writes build/mix.wav and build/mix_stats.json
            run_cmd([PY, str(KIT / "audio/mix.py"), "--project", str(demo)])
            self.assertTrue((demo / "build/mix.wav").exists())
            stats = json.loads((demo / "build/mix_stats.json").read_text("utf-8"))
            self.assertEqual(stats["speech_ratio"], 0.0)

            # 2. Render preview MP4 and verify clean QA pass
            run_cmd(["node", str(KIT / "render.mjs"), "--project", str(demo), "--preview"])
            qa_res = run_cmd([PY, str(KIT / "tools/qa.py"), "--project", str(demo)])
            report = json.loads((demo / "qa/report.json").read_text("utf-8"))
            self.assertEqual(report["status"], "pass", f"Expected clean QA pass, got: {qa_res.stdout}\n{report}")
            self.assertEqual(report["frames_decoded"], 432)

            # 3. Verify serve.mjs HTTP 206 Range streaming
            srv = subprocess.Popen(
                ["node", str(KIT / "serve.mjs"), "--project", str(demo), "--port", "0"],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            )
            try:
                assert srv.stdout is not None
                line = srv.stdout.readline().strip()
                m = re.search(r":(\d+)\b", line)
                self.assertIsNotNone(m)
                port = int(m.group(1))
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

            # 4. Verify qa.py warns when speech_ratio exceeds 45% Awaken sparse-voice ceiling!
            (demo / "build/mix_stats.json").write_text(json.dumps({"duration_sec": 18.0, "has_speech": True, "speech_sec": 11.5, "speech_ratio": 0.639}), "utf-8")
            run_cmd([PY, str(KIT / "tools/qa.py"), "--project", str(demo)])
            rep_dense = json.loads((demo / "qa/report.json").read_text("utf-8"))
            self.assertEqual(rep_dense["status"], "warn")
            self.assertTrue(any("Awaken sparse-voice ceiling" in w for w in rep_dense["warnings"]))

    def test_04_skill_zip_and_tts_thumbnail_tools(self):
        skill_zip = STUDIO_ROOT / "Skill.zip"
        self.assertTrue(skill_zip.exists())
        with zipfile.ZipFile(skill_zip, "r") as zf:
            names = set(zf.namelist())
            self.assertIn("Skill/SKILL.md", names)
            self.assertIn("Skill/kit/audio/tts.py", names)
            self.assertIn("Skill/kit/tools/thumbnail.py", names)
            self.assertIn("Skill/references/awaken-direction.md", names)
            self.assertNotIn("Skill/kit/tools/transcribe.py", names)

        voices_out = run_cmd([PY, str(KIT / "audio/tts.py"), "--list-voices"]).stdout
        self.assertIn("en-US-BrianMultilingualNeural", voices_out)
        self.assertIn("af_heart", voices_out)

        with tempfile.TemporaryDirectory() as tmp:
            demo = Path(tmp) / "thumb_demo"
            shutil.copytree(KIT / "examples/what-if-demo", demo)
            run_cmd([PY, str(KIT / "tools/thumbnail.py"), "--project", str(demo), "--mode", "prompt", "--hook", "QUIET DUSK"])
            self.assertTrue((demo / "exports/thumbnail_ref.png").exists())
            run_cmd([PY, str(KIT / "tools/thumbnail.py"), "--project", str(demo), "--mode", "code", "--hook", "QUIET DUSK"])
            self.assertTrue((demo / "exports/thumbnail.jpg").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
