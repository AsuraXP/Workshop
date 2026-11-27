# Gate 7 Critic QA Sign-Off — *Why You Never Touch Anything*

## 1. Automated Decoder & Loudness Audit (`tools/qa.py`)

- **Deliverable**: `projects/never-touch/out/why-you-never-touch-anything.mp4`
- **Status**: **`PASS`** (`0` errors, `0` warnings)
- **Video Stream**: `1920×1080` (`16:9`), `24.0 fps`, `1,584` decoded frames (`66.00s` vs `66.00s` expected — `0` frame drift)
- **Mastered Audio Stream**:
  - Integrated Loudness: **`-14.06 LUFS`** (target `-14.0 LUFS` ± `0.5 LU`)
  - True Peak: **`-1.31 dBTP`** (ceiling `-1.0 dBTP`)
  - Loudness Range (`LRA`): **`2.6 LU`**
- **Photosensitive Flash Screening**: `0` rapid opposing luminance flash events (`flash_screening.events = []`)
- **Freeze & Blackout Audit**: `max_freeze_sec = 0.0s` across all 12 shots (`s01`–`s12`)

## 2. Visual Contact-Sheet Inspection (`out/sheet.png`, `qa/s01.jpg`..`s12.jpg`)

Three visual polish passes were caught on the first Gate 5 contact sheet and verified on the final master:
1. **`s01` Title Safe Zone**: Lowered the left study-room wall bookshelf from `y = 210` to `y = 340` so the opening `"Why You Never Touch Anything"` title card sits over clean wall space with zero overlap.
2. **`s07` Seated Levitation Continuity**: Kept Nora's lower body in `POSES.sit` hovering `0.2 nm` above the park bench throughout the high-five (`s07`) while animating only her near arm (`eF`, `hF`) upward to meet Milo's hand with the repulsive spark.
3. **`s08` Cutaway Silhouette Contrast**: Added the `MC v2` cream coat cuff (`#dfd8cc`) and a crisp cyan rim (`#7ce8ff` / `#9be8ff`) around the stylized forearm and ball hand inside the dark cutaway card so the forcefield indentation reads effortlessly at a glance.
