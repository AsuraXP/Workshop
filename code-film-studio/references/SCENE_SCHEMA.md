# Scene schema

`film.json` is the editable master. Generate it with `make_film.py`.

```json
{
  "title": "Film",
  "fps": 24, "width": 1280, "height": 720, "crf": 18,
  "mix": {"loudness": -16},
  "audio": [{"src": "audio/score.wav", "start": 0, "volume": 0.8}],
  "shots": [{
    "id": "s01", "duration": 6.0,
    "background": ["#172333", "#263e50"],
    "fade_in": 0.5, "fade_out": 0.0,
    "camera": {"cx": 640, "cy": 360, "zoom": 1.0, "rotate": 0},
    "elements": [],
    "audio": [{"src": "audio/step.wav", "start": 0.5, "volume": 0.7}],
    "captions": [{"start": 0.3, "end": 5.7, "text": "Line"}]
  }]
}
```

## Tracks
Any numeric property can be a constant or `{"keys": [[t, value, easing?], ...]}`. Use helpers:
`track`, `tween`, `hold`, `pulse`, `local`, `push`, `camera`, `apply_walk`.
Eases: linear, smooth, cubic, in, out, back. Colors can interpolate between hex values.
Times are shot-local. Duplicate key times are rejected.

## Element types
- `rect`: x,y,w,h,fill,radius,opacity,stroke,stroke_width
- `ellipse`: cx,cy,rx,ry,fill
- `circle`: cx,cy,r,fill
- `line`: x1,y1,x2,y2,stroke,stroke_width,linecap
- `path`: d (SVG path), fill, stroke, stroke_width
- `polygon` / `polyline`: points
- `text`: x,y,text,size,fill,family,weight,anchor,spacing,layer
- `glow`: cx,cy,r,fill,strength,opacity
- `particles`: mode rain|dust|snow, count, speed, size, fill, opacity, drift, seed
- `rig`: character design dict + pose dict (tracks allowed)
- `group`: x,y,scale,angle,transform,opacity,children

## Layers
`layer`: `far` (parallax-ready world), `world` (default), `foreground`, `screen`.
Screen elements are not affected by the camera. Use for chapter labels and captions.

## Audio
Film-level `start` is absolute film seconds. Shot-level `start` is shot-local; renderer adds the shot offset.
All `src` paths resolve relative to the JSON file. Missing files fail validation.
Mix uses FFmpeg loudnorm; default −16 LUFS, TP −1.5 dBTP.

## Validation
Unique shot ids; duration >0 and ≤120 s; fps 12–60; known element types; existing audio sources.
Render a riskiest-shot preview before full production.
