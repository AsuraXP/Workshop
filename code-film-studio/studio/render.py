"""SVG scene graph -> Cairo raster frames -> H.264, with a code-generated mix."""
from __future__ import annotations
import json, math, os, subprocess, shutil, hashlib
from pathlib import Path
from xml.sax.saxutils import escape
import cairosvg
from PIL import Image
import io
from .motion import sample
from .rig import rig

PRIMITIVES={"rect","ellipse","circle","line","path","text","polyline","polygon","glow","rig","group","particles"}

def load_spec(path):
    p=Path(path); spec=json.loads(p.read_text())
    spec["_base"]=str(p.parent.resolve()); return spec

def resolve(spec, src):
    p=Path(src)
    return p if p.is_absolute() else Path(spec.get("_base","."))/p

def validate(spec):
    assert spec.get("width",1280)>0 and spec.get("height",720)>0
    fps=spec.get("fps",24); assert 12<=fps<=60
    ids=set()
    for shot in spec["shots"]:
        assert shot["id"] not in ids, f"Duplicate shot {shot['id']}"; ids.add(shot["id"])
        assert 0<float(shot["duration"])<=120, "Shots must be <=120s; split longer scenes"
        for e in shot.get("elements",[]):
            assert e["type"] in PRIMITIVES, f"Unknown primitive {e['type']}"
            if e["type"]=="image": assert resolve(spec,e["src"]).exists()
            if e["type"]=="rig": assert "character" in e and "pose" in e
        for a in shot.get("audio",[]):
            assert resolve(spec,a["src"]).exists(), f"Missing audio {a['src']}"
    for a in spec.get("audio",[]): assert resolve(spec,a["src"]).exists()
    return True

def attrs(e):
    out=[]
    mapping={"linecap":"stroke-linecap","linejoin":"stroke-linejoin",
             "dash":"stroke-dasharray","anchor":"text-anchor","weight":"font-weight","spacing":"letter-spacing",
             "family":"font-family","opacity":"opacity","fill_opacity":"fill-opacity","stroke_opacity":"stroke-opacity"}
    for k,v in e.items():
        if k in mapping: out.append(f'{mapping[k]}="{escape(str(v))}"')
    return ' '.join(out)

def draw(e,t,spec):
    p=sample(e,t); typ=p["type"]; a=attrs(p)
    fill=p.get("fill","none"); stroke=p.get("stroke","none"); sw=p.get("stroke_width",1)
    common=f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {a}'
    transform=p.get("transform","")
    if p.get("rotate",0):
        transform+=f' rotate({p["rotate"]} {p.get("rx",p.get("cx",p.get("x",0)))} {p.get("ry",p.get("cy",p.get("y",0)))})'
    tr=f' transform="{transform}"' if transform else ''
    if typ=="rect": return f'<rect x="{p.get("x",0)}" y="{p.get("y",0)}" width="{max(0,p.get("w",0))}" height="{max(0,p.get("h",0))}" rx="{p.get("radius",0)}" {common}{tr}/>'
    if typ=="ellipse": return f'<ellipse cx="{p.get("cx",0)}" cy="{p.get("cy",0)}" rx="{max(0,p.get("rx",0))}" ry="{max(0,p.get("ry",0))}" {common}{tr}/>'
    if typ=="circle": return f'<circle cx="{p.get("cx",0)}" cy="{p.get("cy",0)}" r="{max(0,p.get("r",0))}" {common}{tr}/>'
    if typ=="line": return f'<line x1="{p["x1"]}" y1="{p["y1"]}" x2="{p["x2"]}" y2="{p["y2"]}" {common}{tr}/>'
    if typ=="path": return f'<path d="{p["d"]}" {common}{tr}/>'
    if typ in ("polygon","polyline"): return f'<{typ} points="{p["points"]}" {common}{tr}/>'
    if typ=="text":
        size=p.get("size",32); family=p.get("family","DejaVu Sans")
        return f'<text x="{p.get("x",0)}" y="{p.get("y",0)}" font-size="{size}" font-family="{family}" {common}{tr}>{escape(str(p.get("text","")))}</text>'
    if typ=="glow":
        ident="g"+hashlib.md5((str(p.get("id",""))+fill).encode()).hexdigest()[:10]
        r=max(1,p.get("r",100))
        return f'<defs><radialGradient id="{ident}"><stop offset="0" stop-color="{fill}" stop-opacity="{p.get("strength",.5)}"/><stop offset="1" stop-color="{fill}" stop-opacity="0"/></radialGradient></defs><circle cx="{p.get("cx",0)}" cy="{p.get("cy",0)}" r="{r}" fill="url(#{ident})" opacity="{p.get("opacity",1)}"/>'
    if typ=="rig": return rig(p["character"],p["pose"],t)
    if typ=="group":
        gt=f'translate({p.get("x",0)} {p.get("y",0)}) scale({p.get("scale",1)}) rotate({p.get("angle",0)}) '+p.get("transform","")
        return f'<g transform="{gt.strip()}" opacity="{p.get("opacity",1)}">'+''.join(draw(c,t,spec) for c in p.get("children",[]))+'</g>'
    if typ=="particles":
        # Deterministic rain/dust/snow; no random flicker between renders.
        seed=p.get("seed",7); n=p.get("count",50); speed=p.get("speed",180)
        mode=p.get("mode","rain"); out=[]
        for i in range(n):
            xx=(i*137.508+seed*31)%1400-60
            yy=(i*83.713+t*speed*(.7+(i%7)/10))%850-60
            xx+=math.sin(t*.7+i)*p.get("drift",12)
            op=p.get("opacity",.3)*(.5+(i%5)/10)
            if mode=="rain": out.append(f'<path d="M{xx:.1f},{yy:.1f} l-7,18" stroke="{fill}" stroke-width="{p.get("size",2)}" opacity="{op}"/>')
            else: out.append(f'<circle cx="{xx:.1f}" cy="{yy:.1f}" r="{p.get("size",2)}" fill="{fill}" opacity="{op}"/>')
        return ''.join(out)
    raise ValueError(typ)

def background(spec,shot,t):
    b=sample(shot.get("background","#172333"),t)
    if isinstance(b,list):
        return f'<defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="{b[0]}"/><stop offset="1" stop-color="{b[1]}"/></linearGradient></defs><rect width="1280" height="720" fill="url(#bg)"/>'
    return f'<rect width="1280" height="720" fill="{b}"/>'

def svg_frame(spec,shot,t):
    w,h=spec.get("width",1280),spec.get("height",720)
    cam=sample(shot.get("camera",{}),t)
    z=cam.get("zoom",1); cx=cam.get("cx",w/2); cy=cam.get("cy",h/2)
    # Camera coordinates are the world point at screen centre.
    transform=f'translate({w/2} {h/2}) rotate({cam.get("rotate",0)}) scale({z}) translate({-cx} {-cy})'
    layers=shot.get("elements",[])
    world=''.join(draw(e,t,spec) for e in layers if e.get("layer","world")=="world")
    parallax=''.join(draw(e,t,spec) for e in layers if e.get("layer")=="far")
    front=''.join(draw(e,t,spec) for e in layers if e.get("layer")=="foreground")
    overlay=''.join(draw(e,t,spec) for e in layers if e.get("layer")=="screen")
    fade=1.0
    fi=shot.get("fade_in",0); fo=shot.get("fade_out",0)
    if fi and t<fi: fade=min(fade,t/fi)
    if fo and t>shot["duration"]-fo: fade=min(fade,(shot["duration"]-t)/fo)
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{background(spec,shot,t)}<g transform="{transform}">{parallax}{world}</g>{front}{overlay}<rect width="{w}" height="{h}" fill="#0b1420" opacity="{1-fade}"/></svg>'

def film_time(spec,index): return sum(s["duration"] for s in spec["shots"][:index])

def render_frame(spec,shot,t,out=None):
    png=cairosvg.svg2png(bytestring=svg_frame(spec,shot,t).encode(),output_width=spec.get("width",1280),output_height=spec.get("height",720))
    if out: Path(out).parent.mkdir(parents=True,exist_ok=True); Path(out).write_bytes(png)
    return png

def render(spec_path,output=None,preview=None):
    spec=load_spec(spec_path); validate(spec)
    out=Path(output or Path(spec_path).parent/"out/film.mp4"); out.parent.mkdir(parents=True,exist_ok=True)
    silent=out.with_suffix(".video.mp4")
    fps=spec.get("fps",24); w,h=spec.get("width",1280),spec.get("height",720)
    cmd=["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{w}x{h}","-r",str(fps),"-i","-","-an","-c:v","libx264","-preset","fast","-crf",str(spec.get("crf",18)),"-pix_fmt","yuv420p","-movflags","+faststart",str(silent)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    try:
        for i,shot in enumerate(spec["shots"]):
            if preview is not None and i!=preview: continue
            n=round(shot["duration"]*fps)
            for f in range(n):
                png=render_frame(spec,shot,f/fps)
                im=Image.open(io.BytesIO(png)).convert("RGB")
                proc.stdin.write(im.tobytes())
            print(f"Rendered {shot['id']} ({n} frames)",flush=True)
    finally:
        proc.stdin.close(); code=proc.wait()
    if code: raise RuntimeError("Video encoder failed")
    if preview is not None: return silent
    from .audio import mix
    mix(spec,out,silent)
    silent.unlink(missing_ok=True)
    return out

if __name__=="__main__":
    import argparse
    ap=argparse.ArgumentParser(); ap.add_argument("spec"); ap.add_argument("output",nargs="?"); ap.add_argument("--preview",type=int)
    a=ap.parse_args(); print(render(a.spec,a.output,a.preview))
