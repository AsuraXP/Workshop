#!/usr/bin/env python3
"""Generate a quiet, original procedural documentary score (soft pad + sparse plucks)."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import numpy as np
import soundfile as sf

SR = 48_000
CHORD_SECONDS = 7.6
CYCLE_SECONDS = CHORD_SECONDS * 6
CROSSFADE = 1.20
BLOCK_SECONDS = 4.0
CHORDS = [
    [73.42, 110.00, 146.83, 174.61, 220.00, 329.63],   # Dm(add9)
    [65.41, 98.00, 130.81, 196.00, 261.63, 329.63],   # C(add9)
    [87.31, 130.81, 174.61, 220.00, 261.63, 392.00],  # F(add2/6)
    [58.27, 87.31, 116.54, 174.61, 233.08, 293.66],   # Bb(add2)
    [73.42, 110.00, 146.83, 174.61, 220.00, 261.63],  # Dm7
    [87.31, 130.81, 174.61, 196.00, 261.63, 349.23],  # F(add2)
]
PLUCK_NOTES = [293.66, 440.00, 349.23, 392.00, 293.66, 440.00, 523.25, 392.00,
               349.23, 440.00, 293.66, 392.00, 440.00, 349.23, 293.66, 392.00]
PAN = (-0.22, 0.10, 0.26, -0.12, 0.18, -0.05)


def smoothstep(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


def make_plucks(duration: float, seed: int) -> list[tuple[float, float]]:
    rng = np.random.default_rng(seed)
    events = []
    t = 1.5
    i = 0
    while t < duration - 0.1:
        if rng.random() > 0.12:
            # A gentle pentatonic melody. Shift one octave occasionally for variation.
            octave = 2.0 if rng.random() < 0.08 else 1.0
            events.append((t, PLUCK_NOTES[i % len(PLUCK_NOTES)] * octave))
        t += float(rng.uniform(2.35, 3.25))
        i += 1
    return events


def render_block(start_frame: int, end_frame: int, total_frames: int,
                 plucks: list[tuple[float, float]], pluck_cursor: int) -> tuple[np.ndarray, int, float, float]:
    frames = end_frame - start_frame
    t = (np.arange(start_frame, end_frame, dtype=np.float32) / SR)
    left = np.zeros(frames, dtype=np.float32)
    right = np.zeros(frames, dtype=np.float32)
    block_start, block_end = start_frame / SR, end_frame / SR

    first_cycle = max(0, int(block_start // CYCLE_SECONDS) - 1)
    last_cycle = int(block_end // CYCLE_SECONDS) + 1
    for cycle in range(first_cycle, last_cycle + 1):
        cycle_start = cycle * CYCLE_SECONDS
        for chord_index, notes in enumerate(CHORDS):
            chord_start = cycle_start + chord_index * CHORD_SECONDS
            chord_end = chord_start + CHORD_SECONDS + CROSSFADE
            if chord_end < block_start - CROSSFADE or chord_start > block_end:
                continue
            local_t = t - chord_start
            attack = smoothstep(local_t / CROSSFADE)
            release = smoothstep((chord_end - t) / CROSSFADE)
            env = (attack * release).astype(np.float32)
            breath = (0.94 + 0.06 * np.sin(2 * np.pi * (0.105 + chord_index * 0.006) * t + chord_index + cycle * 0.35)).astype(np.float32)
            env *= breath
            for note_index, freq in enumerate(notes):
                phase = 2 * np.pi * freq * t
                detune = 2 * np.pi * (freq * 1.0014) * t + 0.35 * np.sin(2 * np.pi * 0.08 * t)
                tone = np.sin(phase) + 0.24 * np.sin(2 * phase + 0.15) + 0.10 * np.sin(3 * phase + 0.4)
                tone += 0.22 * np.sin(detune)
                amp = 0.0118 if note_index < 2 else 0.0138
                layer = (amp * env * tone).astype(np.float32)
                pan = PAN[note_index]
                left += layer * (1.0 - pan)
                right += layer * (1.0 + pan)

    # Add only the plucks which overlap this block; echoes are short and quiet.
    while pluck_cursor < len(plucks) and plucks[pluck_cursor][0] < block_start - 2.2:
        pluck_cursor += 1
    i = pluck_cursor
    while i < len(plucks) and plucks[i][0] < block_end:
        event_start, freq = plucks[i]
        event_frames = min(int(1.65 * SR), total_frames - int(event_start * SR))
        if event_frames > 0:
            tau = np.arange(event_frames, dtype=np.float32) / SR
            attack = 1.0 - np.exp(-tau * 180.0)
            decay = np.exp(-tau * 3.15)
            phase = 2 * np.pi * freq * tau + 0.018 * np.sin(2 * np.pi * 4.1 * tau)
            note = (np.sin(phase) + 0.30 * np.sin(2 * phase + 0.2) + 0.11 * np.sin(3 * phase + 0.5))
            note = (0.039 * attack * decay * note).astype(np.float32)
            for delay, gain, side in ((0.0, 1.0, 0), (0.19, 0.21, 1), (0.37, 0.11, -1)):
                event_frame = int(event_start * SR) + int(delay * SR)
                a = max(start_frame, event_frame)
                b = min(end_frame, event_frame + event_frames)
                if b <= a:
                    continue
                seg = note[a - event_frame:b - event_frame] * gain
                if side >= 0:
                    left[a - start_frame:b - start_frame] += seg * (0.82 if side == 0 else 0.72)
                if side <= 0:
                    right[a - start_frame:b - start_frame] += seg * (0.82 if side == 0 else 0.72)
                if side == 1:
                    right[a - start_frame:b - start_frame] += seg
                elif side == -1:
                    left[a - start_frame:b - start_frame] += seg
        i += 1

    absolute_end = (np.arange(start_frame, end_frame, dtype=np.float32) + 1) / SR
    fade_in = smoothstep(t / 1.8)
    fade_out = smoothstep((total_frames / SR - absolute_end) / 2.0)
    fade = (fade_in * fade_out).astype(np.float32)
    stereo = np.column_stack((left * fade, right * fade)).astype(np.float32)
    return stereo, pluck_cursor, float(np.max(np.abs(stereo))), float(np.sum(stereo.astype(np.float64) ** 2))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--duration", type=float, help="Exact score duration in seconds")
    source.add_argument("--word-times", help="Use duration_sec from synthesize.py's word timing JSON")
    parser.add_argument("--out", required=True, help="Output WAV path (48 kHz stereo PCM16)")
    parser.add_argument("--seed", type=int, default=2107, help="Seed for small melodic variations")
    args = parser.parse_args()
    if args.word_times:
        word_path = Path(args.word_times).expanduser().resolve()
        if not word_path.is_file():
            parser.error(f"Word timing file not found: {word_path}")
        args.duration = float(json.loads(word_path.read_text("utf-8"))["duration_sec"])
    if args.duration <= 0 or args.duration > 3600:
        parser.error("Duration must be greater than 0 and no more than 3600 seconds")

    total_frames = int(round(args.duration * SR))
    out = Path(args.out).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    plucks = make_plucks(args.duration, args.seed)
    block_frames = int(BLOCK_SECONDS * SR)
    pluck_cursor = 0
    peak, energy, samples = 0.0, 0.0, 0
    with sf.SoundFile(out, mode="w", samplerate=SR, channels=2, subtype="PCM_16") as wav:
        for start in range(0, total_frames, block_frames):
            end = min(total_frames, start + block_frames)
            block, pluck_cursor, p, e = render_block(start, end, total_frames, plucks, pluck_cursor)
            peak = max(peak, p)
            energy += e
            samples += block.size
            wav.write(np.clip(block, -0.25, 0.25))
    rms = float(np.sqrt(energy / max(1, samples)))
    print(f"Wrote {out} ({args.duration:.2f}s) — soft procedural bed, RMS {20*np.log10(max(rms, 1e-9)):.1f} dBFS, peak {peak:.3f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
