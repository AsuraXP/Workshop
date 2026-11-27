#!/usr/bin/env python3
"""Regenerate Skill/kit/tools/verify_kit.py SHA-256 hashes and package Skill.zip cleanly."""
import argparse, hashlib, shutil, zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILL_DIR = REPO_ROOT / "Skill"
KIT = SKILL_DIR / "kit"

PROTECTED_GLOBS = [
    "package.json",
    "player.html",
    "render.mjs",
    "serve.mjs",
    "engine/*.js",
    "audio/*.py",
    "tools/*.py",
]

VERIFY_TEMPLATE = '''#!/usr/bin/env python3
"""Verify that shared Code Film Studio kit files have not been accidentally modified or corrupted."""
import hashlib, sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent

EXPECTED = {{
{entries}
}}


def main():
    bad = []
    for rel, exp in EXPECTED.items():
        p = KIT / rel
        if not p.exists():
            bad.append(f"MISSING: {{rel}}")
            continue
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        if digest != exp:
            bad.append(f"MODIFIED: {{rel}} (expected {{exp[:12]}}..., got {{digest[:12]}}...)")
    if bad:
        print("Code Film Studio kit integrity check FAILED:")
        for b in bad:
            print(f"  - {{b}}")
        sys.exit(1)
    print(f"Kit integrity verified ({{len(EXPECTED)}} core files clean).")


if __name__ == "__main__":
    main()
'''

EXCLUDE_DIRS = {"__pycache__", "node_modules", ".pytest_cache", "build", "out", "exports", "qa"}


def update_verify_kit() -> int:
    rels = []
    for pat in PROTECTED_GLOBS:
        for p in sorted(KIT.glob(pat)):
            rel = p.relative_to(KIT).as_posix()
            if rel == "tools/verify_kit.py":
                continue
            rels.append(rel)
    rels = sorted(set(rels))
    lines = []
    for rel in rels:
        h = hashlib.sha256((KIT / rel).read_bytes()).hexdigest()
        lines.append(f'    "{rel}": "{h}",')
    (KIT / "tools/verify_kit.py").write_text(VERIFY_TEMPLATE.format(entries="\n".join(lines)), "utf-8")
    return len(rels)


def build_skill_zip(out_path: Path) -> int:
    for pyc in SKILL_DIR.rglob("__pycache__"):
        shutil.rmtree(pyc, ignore_errors=True)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for p in sorted(SKILL_DIR.rglob("*")):
            if any(part in EXCLUDE_DIRS for part in p.parts):
                continue
            if p.is_file() and not p.name.endswith((".pyc", ".pyo", ".DS_Store")):
                arcname = ("Skill/" + p.relative_to(SKILL_DIR).as_posix())
                zi = zipfile.ZipInfo(arcname, date_time=(2026, 1, 1, 0, 0, 0))
                zi.compress_type = zipfile.ZIP_DEFLATED
                zi.external_attr = (0o755 if p.suffix in {".py", ".mjs"} else 0o644) << 16
                zf.writestr(zi, p.read_bytes())
                count += 1
    return count


def main():
    ap = argparse.ArgumentParser(description="Update verify_kit.py hashes and build Skill.zip archive.")
    ap.add_argument("--out", default=str(REPO_ROOT / "Skill.zip"))
    args = ap.parse_args()

    n_hashed = update_verify_kit()
    out = Path(args.out).resolve()
    n_packed = build_skill_zip(out)
    print(f"Updated verify_kit.py ({n_hashed} files hashed) and packed {n_packed} files -> {out}")


if __name__ == "__main__":
    main()
