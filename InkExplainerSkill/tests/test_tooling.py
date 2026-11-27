#!/usr/bin/env python3
"""Offline tests for the independent InkExplainerSkill planning/audio tools."""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent.parent
PY = sys.executable
sys.path.insert(0, str(HERE / "kit" / "audio"))
from synthesize import parse_word_metadata


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    return subprocess.run(cmd, cwd=HERE, env=env, text=True, capture_output=True, check=check)


class InkExplainerToolTests(unittest.TestCase):
    def test_edge_metadata_parser_extracts_word_boundary_seconds(self):
        with tempfile.TemporaryDirectory() as tmp:
            metadata = Path(tmp) / "voice.jsonl"
            metadata.write_text(
                '{"type":"WordBoundary","offset":10000000,"duration":2500000,"text":"Hello"}\n'
                '{"type":"SentenceBoundary","offset":10000000,"duration":2500000,"text":"Hello."}\n'
                '{"type":"WordBoundary","offset":14000000,"duration":3200000,"text":"world."}\n',
                "utf-8",
            )
            words = parse_word_metadata(metadata)
            self.assertEqual([w["text"] for w in words], ["Hello", "world."])
            self.assertEqual(words[0], {"id": 1, "text": "Hello", "start": 1.0, "end": 1.25})
            self.assertEqual(words[1]["start"], 1.4)
            self.assertEqual(words[1]["end"], 1.72)

    def test_new_project_creates_isolated_local_scene_helpers(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp) / "story"
            run([PY, str(HERE / "kit/tools/new_project.py"), str(project), "--title", "Test Story"])
            config = json.loads((project / "project.json").read_text("utf-8"))
            self.assertEqual(config["voice"], "en-US-BrianMultilingualNeural")
            self.assertTrue((project / "src/scene-kit.mjs").is_file())
            scenes = (project / "src/scenes.mjs").read_text("utf-8")
            self.assertIn("./scene-kit.mjs", scenes)
            self.assertFalse((project / "Skill").exists())

    def test_plan_shots_preserves_every_word_and_contiguous_timing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            words = []
            t = 0.18
            tokens = ["At", "night", "the", "valley", "becomes", "quiet.", "Then", "one", "small", "spark", "changes", "everything."]
            for i, token in enumerate(tokens, 1):
                duration = 0.30 if len(token) < 8 else 0.42
                words.append({"id": i, "text": token, "start": round(t, 3), "end": round(t + duration, 3)})
                t += duration + (0.23 if token.endswith((".", "!", "?")) else 0.05)
            src = root / "words.json"
            dst = root / "storyboard.json"
            src.write_text(json.dumps({"duration_sec": round(t + 0.25, 3), "voice": "en-US-BrianMultilingualNeural", "provider": "edge-tts", "source_script": "narration.txt", "words": words}), "utf-8")
            result = run([PY, str(HERE / "kit/tools/plan_shots.py"), "--word-times", str(src), "--out", str(dst)])
            self.assertIn("word-timed shots", result.stdout)
            data = json.loads(dst.read_text("utf-8"))
            self.assertEqual(data["word_count"], len(tokens))
            self.assertEqual([w for shot in data["shots"] for w in shot["word_ids"]], list(range(1, len(tokens) + 1)))
            self.assertAlmostEqual(data["shots"][0]["start"], 0.0, places=3)
            self.assertAlmostEqual(data["shots"][-1]["end"], data["duration_sec"], places=3)
            for a, b in zip(data["shots"], data["shots"][1:]):
                self.assertAlmostEqual(a["end"], b["start"], places=3)

    def test_validator_requires_finished_visual_direction(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "storyboard.json"
            data = {
                "duration_sec": 4.0, "word_count": 2,
                "shots": [
                    {"id": 1, "start": 0, "end": 2, "word_ids": [1], "camera": "wide low", "composition": "figure left, horizon high", "visual": "A figure watches sunset over a ridge", "scene": "sunset"},
                    {"id": 2, "start": 2, "end": 4, "word_ids": [2], "camera": "extreme close-up", "composition": "spark centered against dark ground", "visual": "A bright spark catches in dry moss", "scene": "spark"},
                ],
            }
            path.write_text(json.dumps(data), "utf-8")
            good = run([PY, str(HERE / "kit/tools/validate_storyboard.py"), "--shots", str(path), "--require-art"])
            self.assertIn("Storyboard validated", good.stdout)
            data["shots"][1]["visual"] = "TODO"
            path.write_text(json.dumps(data), "utf-8")
            bad = run([PY, str(HERE / "kit/tools/validate_storyboard.py"), "--shots", str(path), "--require-art"], check=False)
            self.assertNotEqual(bad.returncode, 0)
            self.assertIn("placeholder", bad.stdout)

    def test_music_generator_is_deterministic_and_duration_bounded(self):
        try:
            import numpy as np
            import soundfile as sf
        except ImportError:
            self.skipTest("Install requirements.txt to run the procedural score test")
        with tempfile.TemporaryDirectory() as tmp:
            first, second = Path(tmp) / "one.wav", Path(tmp) / "two.wav"
            tool = str(HERE / "kit/audio/music.py")
            run([PY, tool, "--duration", "3.25", "--seed", "7", "--out", str(first)])
            run([PY, tool, "--duration", "3.25", "--seed", "7", "--out", str(second)])
            a, sr1 = sf.read(first, dtype="int16")
            b, sr2 = sf.read(second, dtype="int16")
            self.assertEqual(sr1, 48000)
            self.assertEqual(sr2, 48000)
            self.assertEqual(a.shape, (int(round(3.25 * 48000)), 2))
            self.assertTrue(np.array_equal(a, b))
            self.assertGreater(float(np.max(np.abs(a))), 0)

    def test_package_has_no_awaken_paths_or_imports(self):
        for p in (HERE / "kit").rglob("*"):
            if p.is_file() and p.suffix in {".py", ".mjs", ".md", ".json"}:
                text = p.read_text("utf-8", errors="ignore")
                self.assertNotIn("Skill/kit", text, f"Cross-package import found in {p.relative_to(HERE)}")
                self.assertNotIn("../Skill", text, f"Cross-package import found in {p.relative_to(HERE)}")
        self.assertEqual(json.loads((HERE / "manifest.json").read_text("utf-8"))["voice_default"]["voice_id"], "en-US-BrianMultilingualNeural")


if __name__ == "__main__":
    unittest.main(verbosity=2)
