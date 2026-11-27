"""Decode every frame; report measurable defects and create review evidence."""
from __future__ import annotations
import json, subprocess, math
from pathlib import Path
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

def probe(path):
    r=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],check=True,capture_output=True,text=True)
    return json.loads(r.stdout)

def inspect(video,spec,outdir):
    out=Path(outdir); out.mkdir(parents=True,exist_ok=True)
    cap=cv2.VideoCapture(str(video)); fps=cap.get(cv2.CAP_PROP_FPS)
    if not cap.isOpened(): raise RuntimeError("Cannot decode film")
    prev=None; lum=[]; rows=[]; allframes=[]; shotrows={}
    idx=0
    while True:
        ok,frame=cap.read()
        if not ok: break
        small=cv2.resize(frame,(320,180)); gray=cv2.cvtColor(small,cv2.COLOR_BGR2GRAY)
        l=float(gray.mean()); lum.append(l)
        delta=float(cv2.absdiff(gray,prev).mean()) if prev is not None else 0
        rows.append({"frame":idx,"time":idx/fps,"luma":l,"motion":delta})
        allframes.append((idx,cv2.resize(frame,(320,180))))
        prev=gray; idx+=1
    cap.release()
    offset=0; summary=[]
    for shot in spec["shots"]:
        a=round(offset*fps); b=round((offset+shot["duration"])*fps)
        rr=rows[a:b]; motion=[r["motion"] for r in rr[1:]]
        mean=float(np.mean(motion)) if motion else 0
        mx=float(np.max(motion)) if motion else 0
        # A cut is expected; exclude first frame from within-shot jump candidates.
        jumps=[r for r in rr[2:] if r["motion"]>max(18,mean*5)]
        sheet=Image.new("RGB",(1280,6*160),"#101923"); draw=ImageDraw.Draw(sheet)
        font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",15)
        picks=np.linspace(a+1,max(a+1,b-2),12).astype(int)
        for j,fi in enumerate(picks):
            fi=min(fi,len(allframes)-1); im=Image.fromarray(cv2.cvtColor(allframes[fi][1],cv2.COLOR_BGR2RGB)).resize((320,180))
            xx=(j%4)*320; yy=(j//4)*160
            sheet.paste(im.resize((320,144)),(xx,yy)); draw.text((xx+6,yy+146),f"{shot['id']}  {fi/fps:.2f}s",fill="#f4e8cf",font=font)
        sheet.save(out/f"{shot['id']}.jpg",quality=90)
        summary.append(dict(id=shot["id"],start=offset,end=offset+shot["duration"],mean_motion=round(mean,3),max_motion=round(mx,3),jump_candidates=len(jumps),reviewed=False))
        offset+=shot["duration"]
    # Whole-film luminance screen, NOT a medical photosensitivity certification.
    flashes=sum(1 for i in range(1,len(lum)) if abs(lum[i]-lum[i-1])>45)
    report=dict(frames=idx,fps=fps,expected_frames=round(offset*fps),duration=offset,
                mean_motion=float(np.mean([r['motion'] for r in rows[1:]])),luma_jump_candidates=flashes,
                shots=summary,manual_review_required=True,
                notes=["Motion metrics cannot judge acting, arcs, intent, or limb intersections.", "Luma screen is heuristic, not WCAG/PEAT certification.", "Every contact sheet must be visually reviewed; mark reviewed only after inspection."])
    (out/"motion_report.json").write_text(json.dumps(report,indent=2))
    # Overview for human/agent review.
    overview=Image.new("RGB",(1280,math.ceil(len(summary)/4)*200),"#101923"); d=ImageDraw.Draw(overview)
    for j,s in enumerate(summary):
        im=Image.open(out/f"{s['id']}.jpg").crop((0,0,320,144)).resize((320,180))
        x=(j%4)*320;y=(j//4)*200;overview.paste(im,(x,y));d.text((x+6,y+182),s["id"],fill="white")
    overview.save(out/"overview.jpg",quality=92)
    return report

def loudness(video):
    r=subprocess.run(["ffmpeg","-hide_banner","-i",str(video),"-af","loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json","-f","null","-"],capture_output=True,text=True)
    text=r.stderr; start=text.rfind('{'); end=text.rfind('}')
    return json.loads(text[start:end+1]) if start>=0 else {"error":text[-1000:]}

if __name__=="__main__":
    import argparse
    from .render import load_spec
    ap=argparse.ArgumentParser();ap.add_argument("video");ap.add_argument("spec");ap.add_argument("--out",default="qa")
    a=ap.parse_args(); r=inspect(a.video,load_spec(a.spec),a.out); print(json.dumps(r,indent=2)); print("Loudness:",loudness(a.video))
