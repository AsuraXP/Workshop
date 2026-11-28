# Render, QA, and Handoff

## Preview before final

- Render a low-resolution review cut and a contact sheet or storyboard sheet.
- Inspect representative frames at the start, middle, and end of every visual beat. Then watch the entire moving cut with sound; a sheet cannot reveal motion artifacts or audio timing.
- If an existing renderer is used, treat its source and packaged Skill as read-only. Put custom scenes, configurations, and output files in the user's project.
- Keep the approved source script, final voiceover, final mix, project configuration, shot plan, and render from the same revision.

## Optional repository renderer workflow

When this repository's existing renderer is available and the user has approved using it, set `KIT` to its `kit/` directory and `PROJECT` to the production directory. Treat all files under the renderer's Skill/toolkit as read-only. The commands below write only project outputs; `--write-shots` can replace a project's shot plan, so use it only for a new project or after backing up the current plan.

```bash
python3 "$KIT/tools/plan_timeline.py" --project "$PROJECT" --mode continuous --write-shots
python3 "$KIT/audio/mix.py" --project "$PROJECT"
node "$KIT/render.mjs" --project "$PROJECT" --sheet
node "$KIT/render.mjs" --project "$PROJECT" --out "$PROJECT/exports/final.mp4"
python3 "$KIT/tools/qa.py" --project "$PROJECT"
```

If the renderer is unavailable, do not install packages or edit another Skill without approval. Ask whether the user wants a different renderer or a tooling plan.

## Technical checklist

Record actual values, not intended values:

- Runtime versus approved duration; frame count and frame rate.
- Resolution and aspect ratio.
- Audio stream presence and its measured duration relative to picture.
- Integrated loudness, true peak, and clipping/listening result.
- Flash/flicker and freeze screening results, noting the limits of any heuristic.
- Shot list duration and narration coverage; ensure the final visual hold or fade is intentional.
- Output filename and project-relative path.

## Human visual checklist

- Apply `references/visual-continuity.md` to the final rendered video.
- Confirm narration-to-action alignment, character identity, threat design, props, lighting, screen direction, readable text, and clean transitions.
- Log any rejected artifacts and the repair/rerender performed.
- Record who reviewed it and whether the full video was watched with sound.

## Sign-off and handoff

- Keep automated results and human review in separate sections of the QA report.
- Do not mark a category pass if it was not checked. Call out unavailable voice identities, estimated alignments, missing captions, and other limitations.
- Present the final video as the primary deliverable; list the source script, audio notes, shot plan, and QA report as supporting files.
- If the user asks for a live preview, serve the final export through a browser-accessible preview and say whether it is private to the workspace or publicly published. Never imply a public upload when only a workspace preview exists.
