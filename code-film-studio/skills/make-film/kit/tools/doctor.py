#!/usr/bin/env python3
"""Environment & dependency check for Code Film Studio."""
import shutil, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import KIT, find_ffmpeg, find_ffprobe

OK, WARN, FAIL = "[ ok ]", "[warn]", "[MISS]"
bad = False


def line(tag, msg):
    print(f"  {tag}  {msg}")


print("Code Film Studio — environment check\n")

# 1. Core binaries
node_bin = shutil.which("node")
if node_bin:
    v = subprocess.run([node_bin, "--version"], capture_output=True, text=True).stdout.strip()
    line(OK, f"node -> {node_bin} ({v})")
else:
    line(FAIL, "node -> install Node.js 18+")
    bad = True

ff = find_ffmpeg()
if ff:
    v = (subprocess.run([ff, "-version"], capture_output=True, text=True).stdout or "").splitlines()[0][:72]
    line(OK, f"ffmpeg -> {ff} ({v})")
else:
    line(FAIL, "ffmpeg -> install system ffmpeg or `pip install imageio-ffmpeg`")
    bad = True

fp = find_ffprobe()
if fp:
    line(OK, f"ffprobe -> {fp}")
else:
    line(WARN, "ffprobe -> not on PATH (using ffmpeg header fallback in common.py)")

# 2. Python packages
for mod, pip_name, required in [
    ("numpy", "numpy", True),
    ("scipy", "scipy", True),
    ("PIL", "pillow", True),
    ("cv2", "opencv-python-headless (optional, faster qa.py decode)", False),
    ("faster_whisper", "faster-whisper (optional, for voiceover word alignment)", False),
]:
    try:
        __import__(mod)
        line(OK, f"python:{mod}")
    except ImportError:
        line(FAIL if required else WARN, f"python:{mod} -> pip install {pip_name.split()[0]}")
        bad |= required

# 3. Node rendering backends (Playwright Chromium for 2D+3D, or @napi-rs/canvas for 2D headless)
nm = KIT / "node_modules"
has_pw = (nm / "playwright").exists()
has_three = (nm / "three").exists()
has_napi = (nm / "@napi-rs/canvas").exists() or Path("/tmp/node-test/node_modules/@napi-rs/canvas").exists()

if has_three:
    line(OK, "node:three (3D WebGL kit)")
else:
    line(WARN, f"node:three -> run `cd {KIT} && npm install` for 3D shots")

if has_pw:
    r = subprocess.run(
        ["node", "-e", "import('playwright').then(async p=>{const b=await p.chromium.launch();await b.close();})"],
        cwd=KIT, capture_output=True, text=True,
    )
    if r.returncode == 0:
        line(OK, "playwright chromium (2D + 3D WebGL backend ready)")
    elif has_napi:
        line(WARN, "playwright chromium missing -> using @napi-rs/canvas 2D backend (run `npx playwright install chromium` for 3D)")
    else:
        line(FAIL, f"chromium not launched -> run: cd {KIT} && npx playwright install chromium")
        bad = True
elif has_napi:
    line(OK, "node:@napi-rs/canvas (2D headless render backend ready)")
else:
    line(FAIL, f"no render backend -> run: cd {KIT} && npm install && npx playwright install chromium")
    bad = True

print("\nREADY." if not bad else "\nMissing required items above — see references/install.md.")
sys.exit(1 if bad else 0)
