# QA and delivery gates

## Automated
```bash
python3 -m unittest discover -s tests -v
python3 -m studio.qa films/<slug>/out/film.mp4 films/<slug>/film.json --out films/<slug>/qa
```
The QA module decodes every frame, writes per-shot contact sheets and `motion_report.json`, and reports:
- frame count/fps/duration vs spec
- mean/max motion per shot
- within-shot jump candidates
- whole-film luminance jump candidates (heuristic)
It also provides `loudness(video)` via FFmpeg loudnorm measurement.

## Mandatory visual review
Open every contact sheet. For each shot record in `production/qa.md`:
- focal object readable; no unintended off-screen elements
- expression legible at actual size
- limbs do not intersect face/body unintentionally
- attached props stay attached
- captions do not cover action
- continuity of costume, prop state, light and screen direction
- motion starts/settles smoothly; deliberate holds are labelled
- cut rhythm matches intent

Metrics are candidates, not verdicts. A low-motion hold can be correct; a high-motion cut can be intentional. Mark `reviewed: true` only after inspection.

## Audio review
- Confirm audio stream exists, duration matches picture.
- Measure integrated loudness and true peak.
- Check cue list against action times.
- Listen when playback is available; otherwise state "measured, not listened."

## Safety
The luminance screen is a heuristic, not WCAG/PEAT certification. Avoid >3 full-frame high-contrast flashes per second. For public/broadcast delivery, run a certified photosensitivity tool and disclose if not done.

## Rubric (score 0–4 each; target ≥24/32, no zeros)
1. Story clarity
2. Character identity/consistency
3. Expression/acting readability
4. Motion quality/weight
5. Camera/framing
6. Art direction/lighting
7. Sound design/mix
8. Edit/pacing/delivery

## Defect loop
Record: shot, timecode, evidence, rule, owner, severity, fix, re-test. Fix critical/major defects, re-render changed shots, re-run QA. Do not deliver with critical defects.

## Deliver
MP4 (H.264/AAC), SRT when applicable, production artifacts, QA evidence, and the skill package. Final message states runtime/resolution/fps, checks performed, changes after review, and limitations. Never claim reference fidelity without inspected reference frames/audio.
