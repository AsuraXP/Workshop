# Inkframe house style — original, code-only

This is the skill's written baseline. It was developed because the requested YouTube reference could not be downloaded. **Reference fidelity is unverified.** Do not describe this as a frame-matched copy of DISCIPLINE or any other film.

## Signature: "Ink & Ember"

A warm, hand-shaped 2D world built from bold silhouettes, quiet negative space, and one emotionally motivated light source. Characters are small, rounded, expressive couriers of feeling; environments are layered paper-cut shapes with restrained detail.

## Character design language

- **Silhouette:** pear/teardrop torso, oversized rounded head, short limbs, large hands. Readable as a solid shape at thumbnail size.
- **Face:** cream face plate inside a dark hood/head; two large ink eyes with catchlights; simple angled brows; one curved mouth. Emotion comes from brow + mouth + head tilt + body lean together.
- **Signature details:** a small leaf sprout, a warm scarf, and a cross-body satchel. These make the house lead recognizable. New characters may replace species/costume details but keep the same construction logic.
- **Proportions:** head ≈ 40% of standing height; torso ≈ 35%; legs ≈ 25%. Hands are circles large enough to read.
- **Line/shape:** filled vector shapes, rounded terminals, no photorealistic texture. Use a subtle lighter stroke on one edge for form, not heavy outlines everywhere.
- **Costume:** at least three readable items with distinct colors. Keep them consistent across shots.
- **Expression range:** neutral, hope, worry, fear, determination, grief, relief, joy. Test each at actual render size.
- **Uniqueness:** do not copy a reference character's exact design. Change silhouette, costume, species, palette and story device when creating a permanent lead.

## Palette

Default narrative palette:
- Ink navy `#172333` / `#243447`
- Slate blue `#36576a`
- Cream `#f4e8cf`
- Ember amber `#e9b44c`
- Living green `#8fb89a`
- Warm leather `#9c6b45`

Rules:
- One dominant cool field, one warm focal accent. Accent follows the story object or emotional light.
- Backgrounds are lower contrast than the lead. Do not let set detail compete with the face.
- Genre overrides are allowed: comedy may brighten; horror may desaturate and deepen shadows; explainer may use categorical colors. Record the override in style.md.

## Environments

- Layered depth: far silhouettes → midground set → action plane → foreground atmosphere.
- Every location needs a ground plane, 2–3 identifying props, and a motivated light source.
- Use gradient skies/walls sparingly; prefer shape layers and value separation.
- Add one small life motion per shot: drifting dust, flickering lamp, breathing, leaf sway, distant window.
- Time/state devices (clock, tally, calendar, seed growth, window lights) should change when the story changes.

## Lighting

- Light is narrative: cool = distance/obstacle, warm = effort/connection, green = renewal, darkness = loss or pause.
- Use radial glows at sources, not uniform bloom over everything.
- Keep faces readable. If a scene is dark, raise face/value contrast rather than adding random fill.
- Avoid full-frame rapid luminance flips.

## Camera and editing

- Establish in wide; act in medium; feel in close-up.
- Slow push for realization; pull for isolation; pan for geography; static hold for weight.
- Camera moves must have a reason. Default move is 3–8% over a shot, not a constant zoom.
- Hard cuts by default. Fade only for time passage, memory, or ending.
- Hold important new information ≥1.5 s; reaction beats ≥0.8 s unless comedy requires a sharper cut.
- Keep important content inside the central 80%; captions in a dedicated lower band.

## Sound identity

- Original procedural score: soft pad harmony + pentatonic bell/pluck motif + sparse bass.
- Music changes with story phase, not every shot.
- Foley is dry and readable: steps, cloth, clicks, impacts, doors, rain, wind.
- Ambience establishes location; silence is a deliberate choice.
- No dialogue by default. When needed, use local/authorized voice and captions.

## What improves on a minimal reference

- Motivated camera instead of random movement.
- Dedicated caption safe band.
- Prop attachment derived from rig math.
- Separate pose timelines for each character.
- Procedural Foley and ambience, not music alone.
- Measured QA plus visual review, not "the code ran."
