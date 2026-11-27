---
name: video-styles
description: Preview a film project across all 9 universal visual styles (awaken, daylight, cinema, noir, emerald, ember, arctic, sakura, retro) as a side-by-side PNG comparison grid, or switch config.json to a chosen style.
argument-hint: "[project-dir] [optional: style-id or --at seconds]"
---

# `/video-styles` — Art Direction & 9-Style Comparison Grid

Render a representative moment of `<project>` across all 9 built-in styles in `/kit/engine/styles.js` so art direction can be compared visually, or apply a chosen style to `config.json`.

Let `KIT="${CLAUDE_SKILL_DIR}/../make-film/kit"` and `REFS="${CLAUDE_SKILL_DIR}/../make-film/references"`. Read `$REFS/style-bible.md` for palette & genre guidance.

## Built-In Style IDs (`engine/styles.js`)

| Style ID | Display Name | Character & Genre Fit |
|----------|--------------|-----------------------|
| `awaken` | **Awaken Twilight** | Default warm 2.5D curiosity look: twilight periwinkle shadows + sunset peach/amber rim |
| `daylight` | **Clean Daylight** | High-key comedy, crisp tutorials, everyday slice-of-life, bright daytime worlds |
| `cinema` | **Ink & Ember** | Storybook narrative drama, silent/emotional shorts (slate-navy & ember gold) |
| `noir` | **Midnight Noir** | High-contrast mystery, suspense, horror, midnight atmosphere |
| `emerald` | **Emerald Pulse** | Forest/mint shadows & gold key for biology, ecology, sci-fi |
| `ember` | **Ember Forge** | Molten crimson & copper high-intensity action / physics extremes |
| `arctic` | **Arctic Glass** | Crisp steel-teal & cyan for technology, medicine, engineering |
| `sakura` | **Sakura Bloom** | Plum & rose-peach haze for romance, memory, poetic essays |
| `retro` | **Retro Print** | Muted teal, mustard, and print grain for historical vignettes |

## Workflow

1. **Render the 9-Style Comparison Grid** at a representative character + environment timestamp `--at <sec>`:
   ```bash
   node "$KIT/render.mjs" --project <project_dir> --styles --at <sec> --out <project_dir>/exports/styles.png
   ```
2. **Inspect `<project_dir>/exports/styles.png`** visually to confirm silhouette separation (`MC v2` head + cream features + coat shading) and text contrast.
3. **Apply a Chosen Style:** Set `"style": "<style_id>"` in `<project_dir>/config.json` (or pass `--style <style_id>` to `render.mjs` for alternate exports).
