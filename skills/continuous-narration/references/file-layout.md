# Suggested Project Layout

Keep generated assets and story-specific code with the production, not inside this Skill.

```text
<project>/
  config.json
  production/
    brief.md
    script.md
    narration.txt
    audio.md
    qa.md
  audio/
    voiceover-raw.wav
    voiceover.wav
  story/
    shots.json
  timeline/
    sentences.json
    words.json
  scenes/
    index.js
  build/
    mix.wav
  exports/
    final.mp4
    sheet.png
  qa/
    report.json
    overview.jpg
    s01.jpg ...
```

Use only the files relevant to the selected renderer. Keep temporary takes distinguishable from final audio, and never overwrite a verified source take with an unrelated revision. Record any differences from this layout in the production brief.
