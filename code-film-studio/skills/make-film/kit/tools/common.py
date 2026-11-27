"""Shared paths, FFmpeg discovery, and helpers for Code Film Studio tools."""
import json, os, re, shutil, subprocess, sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent


def find_ffmpeg() -> str | None:
    env_bin = os.environ.get("FFMPEG_BIN")
    if env_bin and Path(env_bin).exists():
        return env_bin
    which = shutil.which("ffmpeg")
    if which:
        return which
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and Path(exe).exists():
            return exe
    except Exception:
        pass
    return None


def find_ffprobe() -> str | None:
    env_bin = os.environ.get("FFPROBE_BIN")
    if env_bin and Path(env_bin).exists():
        return env_bin
    return shutil.which("ffprobe")


def require_bin(name: str) -> str:
    if name == "ffmpeg":
        exe = find_ffmpeg()
        if exe:
            return exe
    elif name == "ffprobe":
        exe = find_ffprobe()
        if exe:
            return exe
    else:
        exe = shutil.which(name)
        if exe:
            return exe
    sys.exit(f"ERROR: '{name}' not found. Run: python {KIT/'tools/doctor.py'}")


def project_dir(arg: str) -> Path:
    p = Path(arg).resolve()
    if not (p / "config.json").exists():
        sys.exit(f"ERROR: {p} has no config.json (not a project folder)")
    return p


def load_json(p: Path, default=None):
    return json.loads(p.read_text("utf-8")) if p.exists() else default


def save_json(p: Path, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", "utf-8")


def media_duration(media: Path) -> float:
    """Return media duration in seconds via ffprobe, falling back to ffmpeg -i header parse."""
    probe = find_ffprobe()
    if probe:
        out = subprocess.check_output(
            [probe, "-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", str(media)],
            text=True,
        ).strip()
        return float(out)

    ff = require_bin("ffmpeg")
    proc = subprocess.run([ff, "-hide_banner", "-i", str(media)], capture_output=True, text=True)
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", proc.stderr or "")
    if not m:
        raise RuntimeError(f"Could not determine media duration for {media}")
    h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
    return h * 3600 + mn * 60 + s
