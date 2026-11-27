# Universal Style Bible & MC v2 Character Sheet

Code Film Studio pairs **one iconic, expressive house character architecture (`MC v2`)** with **genre-adaptive worlds, palettes, lighting, and cinematography**. The character stays immediately recognizable whether the film is a scientific "What If" essay, an intimate silent drama, a high-key comedy, a noir thriller, or a musical montage.

---

## 1. The `MC v2` House Character Rig (`engine/rig2d.js` & `engine/three-kit.js`)

Every recurring human character uses **`MC v2`** (`240` logical units tall at `s = 1`, feet planted at `[x, y]`):

### Anatomy & Proportions
- **Head (`HR = 25`):** Matte charcoal-black sphere (`S().ink`, default `#18161f`) with subtle velvety radial volume and a **razor-tapered spherical crescent rim light** (`rim: { color, dir: [dx, dy], w }`) on the lit side. Never draw colored skin tones; silhouette contrast is what makes minimalist expressions read effortlessly at every scale.
- **Face (`S().feature`, warm cream `#fff6e6`):**
  - **Eyes:** Vertical warm-cream ovals (`joy` switches to cheerful curved arcs; `blink: 0..1` closes smoothly).
  - **Brow Bars (Always Present):** Flat rounded pill bars above each eye. **Brows carry 70% of the acting**—tilting inner-up (`worry`, `sad`), inner-down (`determined`, `angry`), lifting (`surprised`, `joy`), or arching asymmetrically (`smirk`, `thinking`, `confused`).
  - **Mouth:** Small, clean, understated curve or oval `'o'` / syllable ellipse (`talk: 0..1` or `openMouth: 0..1`). Never draw teeth, tongues, or noses.
- **Neck:** Short, clean dark column connecting head and collar.
- **Shaded 2.5D Coat / Tunic (`top: 'coat'` default):** Smooth rounded-shoulder tapered tunic (`y = -188 .. -98`) with automatic cylindrical shading (`S().coatShadow` cool ambient shadow side -> warm lit coat color + subtle lit-edge rim highlight).
- **Limbs, Ball Hands & Flat Feet:** Crisp dark limbs (`width ~ 9–10`), **always-present solid round ball hands** (`r = 7.6`, far arm/leg tinted slightly toward ambient for clean 2.5D overlap), and flat forward-pointing foot wedges resting on `y = 0` over a soft elliptical contact shadow.

### Parameterized Cast Differentiation (`scenes/cast.js`)
Differentiate cast members cleanly through **silhouette, coat palette (`COATS`), attire (`outfit`), and posture**:
- **Coat Colors (`COATS`):** `cream` (`#f6efdd`, default), `sage` (`#cfe3c8`), `peach` (`#e9b79d`), `sky` (`#bcd7ee`), `butter` (`#f1d98a`), `coral` (`#e58b78`), `lavender` (`#cec4ea`), `slate` (`#4b566b`), `mustard` (`#eab84e`), `teal` (`#4f9a94`).
- **Attire Variants (`outfit.top`):**
  - `'coat'` — signature `MC v2` rounded tunic (default)
  - `'cardigan'` — open colored coat/cardigan over cream inner shirt strip
  - `'labcoat'` — open coat over colored shirt
  - `'hoodie'` — rounded tunic with collar hood fold & pocket seam
  - `'suit'` — jacket + V-shirt + accent tie
  - `'tshirt'` / `sleeveCap: true` — adds short sleeve cap on near shoulder
  - `'dress'`, `'royal'`, or `'none'` (pure silhouette line for abstract diagrams)
- **Head/Age Variants (`outfit.head` & accessories):** `'none'` (default), `'elder'` (white temple/crown hair puffs + subtle forehead lines when `aged: true`), `'ponytail'`, `'bun'`, `'curly'`, `'spiky'`, `'cap'`, `'capBack'`, `'beanie'`, `'fedora'`, `'headband'`, `'crown'`, plus `glasses: true` or `kid: true` (`0.68x` body with larger head ratio).

---

## 2. Universal Visual Styles (`config.json -> "style"`)

All 9 built-in styles in `engine/styles.js` re-grade `mood()` palettes, UI cards, character ink/coat shadows, and post-processing automatically:

| Style ID | Name | Best For |
|----------|------|----------|
| `awaken` *(default)* | **Awaken Twilight** | Curiosity explainers, "What If" science/history essays, thoughtful storytelling (twilight periwinkle shadows, warm peach/amber rim, soft haze). |
| `daylight` | **Clean Daylight** | Comedy, bright educational tutorials, everyday slice-of-life, upbeat stories (crisp sky blues, sunlit cream walls, minimal vignette/grain). |
| `cinema` | **Ink & Ember** | Narrative drama, emotional/silent shorts, fables (deep slate-navy fields + warm ember-amber focal light). |
| `noir` | **Midnight Noir** | Suspense, mystery, horror, thriller (obsidian shadows, cold moonlight, high contrast, tactile grain). |
| `arctic` | **Arctic Glass** | Technology, medicine, space/engineering deep-dives (clinical steel-teal & cyan). |
| `emerald` | **Emerald Pulse** | Biology, ecology, finance/cyber aesthetics (forest shadows & mint-gold highlights). |
| `ember` | **Ember Forge** | High-stakes action, physics extremes, catastrophe, intensity (crimson & molten copper). |
| `sakura` | **Sakura Bloom** | Romance, memory, poetry, gentle personal essays (plum shadows & rose-peach light). |
| `retro` | **Retro Print** | Historical stories, archival vignettes, vintage aesthetics (faded teal, mustard, print grain). |

---

## 3. Genre-Adaptive Visual & Framing Rules (No Hardcoded Clichés)

Match lighting, framing, overlays, and camera movement to the **genre of the film**—never force a single formula onto every project:

1. **Lighting Motivation:** Every scene should have a clear light direction (`day`, `golden`, `dusk`, `night`, `storm`, `interiorWarm`, `interiorCool`, `studio`, `void`). Daytime comedies and clean explainers belong in bright `day` / `studio` / `daylight` palettes; intimate dramas and twilight essays shine in `dusk` / `interiorWarm`; horror belongs in `night` / `noir`.
2. **Letterbox Bars (`config.json -> "bars"`):** Default is `"none"` (clean full-bleed `16:9` or `9:16`). Use `"thin"` or `"wide"` only when framing a cinematic narrative drama or widescreen sequence where letterbox framing is an intentional artistic choice.
3. **Depth & Set Construction:** Build locations in 3 planes (`layer(g, cam, 0.25, bg)`, `0.6` mid, `1.0` character stage, optional `1.25` foreground blur/foliage). Keep the zone directly behind character heads uncluttered so dark `MC v2` heads never merge into dark background shapes (use sky gradients, warm practical glows, haze, or rim light for separation).
4. **Data & Diagram Shots:** Use `dataCard`, `compareBars`, `timelineStrip`, `blueprint`, and `callout` when explaining numbers, timelines, or mechanisms—never paste raw paragraphs of text onto the screen, and never force number cards into purely narrative dramas.
5. **Endings (`endCard`):** End on an image or question that resolves the film's premise. Do **not** add `"Subscribe"` buttons (`cta: false` default) unless the user specifically asks for a YouTube channel CTA.
6. **Aspect Adaptation (`16:9` vs `9:16`):** Always position stage ground, character scale, and UI cards with `V(landscapeVal, verticalVal)`. Keep essential faces and text inside the central safe zone (on `9:16`, keep key content inside `y = 220..1620` away from platform UI chrome).
