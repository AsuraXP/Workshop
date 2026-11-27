# Visual Direction — Flat Ink Comic

## Visual grammar

The picture language is a minimalist 2D editorial webcomic, not a shaded 3D cartoon. Each panel should communicate its idea at a glance, with one clear focal action and supporting details that do not compete with it.

- Use confident, clean black outlines with a very slight deterministic hand wobble; keep line weight consistent within a shot.
- Use solid, matte fills. Choose a small scene palette (usually three to six colors) and reserve accent colors for the focal idea.
- Make recurring people white-filled circular heads with black outlines and simple black stick limbs. Keep proportions, head size, and expression style consistent from panel to panel.
- Use brows, eye direction, mouth, body angle, and gesture to make the figures readable at thumbnail scale.
- Ground people and objects with a baseline, shadow shape, or clear contact point. Avoid accidental floating.
- Prefer recognizable, concrete props and spatial metaphors over abstract decoration.
- Reserve large text for short labels, sound effects, numbers, or a diagram. The narration carries the explanation.

## Camera vocabulary

Use a purposeful rotation of establishing wide, wide two-shot, medium action, close-up, extreme close-up, low angle, overhead map/diagram, profile, silhouette, prop insert, and infographic. The written storyboard must name the camera scale and composition for every shot.

For each hard cut, vary at least two of:

1. distance/scale of the subject;
2. camera height or angle;
3. subject placement and negative space;
4. dominant shape or color block;
5. number of figures and their gesture.

Do not solve variety by changing only background color. Do not reuse the same framing in neighboring panels. Reuse a character for continuity, but change the staging.

## Readability and restraint

- Compose for 16:9 and keep faces, hands, props, and labels inside a 5% title-safe margin.
- Keep characters large enough to read; a key prop should not be a tiny detail in a wide shot.
- Use high contrast between figure, prop, and background. Never use color as the only cue for an important distinction.
- Avoid gradients, drop-shadow-heavy UI, glossy highlights, 3D lighting, photographic textures, and busy ornamental backgrounds.
- Avoid split panels unless the comparison itself is the point.

## Code implementation

Use `kit/scene-kit.mjs` for seeded ink primitives, palette constants, and the white-head figure. It must remain deterministic: rendering the same frame twice should produce identical pixels. Add topic-specific scene functions in the project's own `src/scenes.mjs`; do not alter the Awaken package to reuse its engine.
