#!/usr/bin/env python3
"""Package only the independent InkExplainerSkill tree into InkExplainerSkill.zip."""
from __future__ import annotations

import argparse
from pathlib import Path
import zipfile

REPO_ROOT = Path(__file__).resolve().parent.parent
PACKAGE = REPO_ROOT / "InkExplainerSkill"
EXCLUDED_DIRS = {"node_modules", "__pycache__", ".pytest_cache", "build", "out", "dist", "exports", "qa"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo", ".mp3", ".wav", ".mp4", ".mov", ".webm"}


def build(out_path: Path) -> int:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    files = []
    for path in sorted(PACKAGE.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(PACKAGE)
        if any(part in EXCLUDED_DIRS for part in rel.parts):
            continue
        if path.suffix.lower() in EXCLUDED_SUFFIXES or path.name in {".DS_Store"}:
            continue
        files.append((path, rel))
    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path, rel in files:
            info = zipfile.ZipInfo(f"InkExplainerSkill/{rel.as_posix()}", date_time=(2026, 11, 27, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            executable = path.suffix in {".py", ".mjs"}
            info.external_attr = (0o755 if executable else 0o644) << 16
            archive.writestr(info, path.read_bytes())
    return len(files)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default=str(REPO_ROOT / "InkExplainerSkill.zip"))
    args = parser.parse_args()
    out = Path(args.out).expanduser().resolve()
    count = build(out)
    with zipfile.ZipFile(out) as archive:
        names = archive.namelist()
    if not names or any(not name.startswith("InkExplainerSkill/") for name in names):
        raise SystemExit("Isolation check failed: archive must contain only InkExplainerSkill/ paths")
    if any(name.startswith("InkExplainerSkill/Skill/") or name.endswith("Skill.zip") for name in names):
        raise SystemExit("Isolation check failed: Awaken assets must not enter this archive")
    print(f"Packed {count} isolated files -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
