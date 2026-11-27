"""THE LAST LIGHT — an original code-only test film for Inkframe Studio.
Run: python3 examples/small_light/make_film.py
No image, video or speech generation models. All pixels and samples are code.
"""
from __future__ import annotations
import sys, json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; sys.path.insert(0,str(ROOT))
from studio.motion import track, tween, hold, pulse, push, camera, apply_walk
from studio.rig import hand_position
from studio.scenery import *
from studio.audio import build_soundtrack, cue, tone, noise, SR
import numpy as np

HERE=Path(__file__).resolve().parent
CHAR=dict(name="Pip",head_scale=1.05,sprout=True,satchel=True,
 costume=dict(body="#243447",face="#f4e8cf",accent="#e9b44c",boots="#172333",scarf="#e9b44c",satchel="#9c6b45",sprout="#8fb89a"))

def base_pose(x,y,scale=1,**kw):
    d=dict(x=x,y=y,scale=scale,lean=0,bob=0,arm_l=-12,arm_r=28,leg_l=-5,leg_r=5,
           head_tilt=0,head_y=-105,brow=0,mouth=0,blink=1,gaze=0,scarf_lag=0,squash=1)
    d.update(kw); return d

def blink_track(d,at):
    return track([[0,1],[at,1],[at+.08,.05],[at+.18,1],[d,1]])

def carry(pose,d,lantern_scale=.65,lit=1):
    """Attach a prop to the animated near hand, sampled from the same rig math."""
    times=[i*.125 for i in range(round(d/.125)+1)]
    xs=[];ys=[]
    for t in times:
        x,y=hand_position(pose,t); xs.append([t,x+4]);ys.append([t,y+24])
    l=lantern(0,0,lantern_scale,lit)
    l["x"]=track(xs);l["y"]=track(ys);l["angle"]=tween(-4,4,0,d)
    return l

def carry_seed(pose,d):
    times=[i*.125 for i in range(round(d/.125)+1)];xs=[];ys=[]
    for t in times:
        x,y=hand_position(pose,t);xs.append([t,x+2]);ys.append([t,y+8])
    return dict(type="group",x=track(xs),y=track(ys),children=[glow(0,0,70,"#a8d6a0",.4),ellipse(0,0,8,12,"#a8d6a0"),path("M0,-10 Q-12,-24 -15,-15 Q-8,-7 0,-10 M0,-11 Q6,-27 14,-21 Q12,-11 0,-11","#8fb89a")])

def shot(id,d,elements,cam=None,**kw):
    return dict(id=id,duration=d,elements=elements,camera=cam or camera(duration=d),**kw)

def chapter(num,title):
    return [text(64,62,f"{num:02d}",18,"#e9b44c",weight="bold",layer="screen"),
            text(100,62,title,18,"#b8c9cf",spacing=2,layer="screen")]

def caption(t): return [rect(0,642,1280,78,"#0b1420",opacity=.88,layer="screen"),dict(type="text",x=640,y=687,text=t,size=25,fill="#f4e8cf",anchor="middle",layer="screen")]

def build():
    shots=[]
    # 01 — Establish want. Walk enters from off-screen; city is asleep.
    d=6; p=base_pose(180,485,1.05,mouth=.3)
    p=apply_walk(p,3,.4,5.4); p["x"]=tween(-100,690,.4,5.4,"linear");p["blink"]=blink_track(d,3.2)
    els=[*stars(),*city(lit=.05),*ground(),
         dict(type="rig",character=CHAR,pose=p),carry(p,d),
         *chapter(1,"THE LAST LIGHT"),*caption("One small light. A long way home.")]
    shots.append(shot("s01",d,els,push(560,380,1,1.06,d),fade_in=.6))
    # 02 — Emotional close-up. The ember is safe; Pip smiles.
    d=5; p=base_pose(570,610,1.8,mouth=.8,blush=.4,head_tilt=-5,gaze=1)
    p["head_tilt"]=track([[0,-5],[1.5,-8],[3,2],[5,-3]]);p["mouth"]=tween(.2,.9,.5,2)
    p["blink"]=blink_track(d,2.6);p["bob"]=tween(0,-4,0,2.5)
    els=[*city(lit=.03),*ground(),glow(850,390,330,"#e9b44c",.25),
         dict(type="rig",character=CHAR,pose=p),carry(p,d,.55),
         *chapter(2,"A PROMISE"),*caption("Pip promised to keep it burning.")]
    shots.append(shot("s02",d,els,push(620,360,1.05,1.15,d)))
    # 03 — Storm. Lean into wind, shorter steps, scarf lag.
    d=6; p=base_pose(300,485,1.05,lean=14,brow=.7,mouth=-.4,head_tilt=8)
    p=apply_walk(p,3,.3,5.6,stride=18,bob=4,swing=24);p["x"]=tween(250,820,.3,5.6,"linear")
    p["lean"]=track([[0,14],[2,20],[3,12],[4,22],[6,16]]);p["scarf_lag"]=tween(10,28,0,2)
    els=[*mountains("#233c4c"),*ground("#10232f"),
         path("M-100,600 Q640,520 1380,600",stroke="#47616b",stroke_width=12),
         dict(type="rig",character=CHAR,pose=p),carry(p,d,.65,lit=.8),
         dict(type="particles",mode="rain",count=90,speed=420,fill="#9db8c6",opacity=.35,layer="foreground"),
         *chapter(3,"THE STORM"),*caption("The wind had other plans.")]
    shots.append(shot("s03",d,els,push(600,380,1,1.04,d)))
    # 04 — Failure close-up. Light dies; expression changes before the cut.
    d=5; p=base_pose(560,620,1.85,brow=.2,mouth=.2,head_tilt=4,gaze=1)
    p["brow"]=tween(.2,1,1.2,2.2);p["mouth"]=tween(.2,-.9,1.2,2.2)
    p["head_tilt"]=tween(4,14,1.2,2.5);p["arm_r"]=tween(28,12,1.2,2.5)
    p["blink"]=blink_track(d,3.4)
    lit=track([[0,1],[1.1,1],[1.35,.2],[1.5,.7],[1.8,0],[5,0]])
    l=carry(p,d,.6);l["children"][2]["fill"]=lit # flame window
    els=[*city(lit=0),*ground(),dict(type="rig",character=CHAR,pose=p),l,
         dict(type="particles",mode="rain",count=65,speed=450,fill="#9db8c6",opacity=.3,layer="foreground"),
         *chapter(4,"OUT"),*caption("Then, nothing.")]
    shots.append(shot("s04",d,els,push(620,370,1.05,1.18,d)))
    # 05 — Turn. Pip kneels, opens satchel, finds a living seed.
    d=6; p=base_pose(560,620,1.7,brow=.9,mouth=-.8,head_tilt=12,leg_l=-35,leg_r=38)
    p["y"]=track([[0,620],[1,650],[2,650],[4.5,625],[6,620]])
    p["lean"]=tween(0,18,.5,1.5);p["arm_r"]=track([[0,12],[1,45],[2.2,70],[3.5,40],[6,28]])
    p["brow"]=track([[0,.9],[2.5,.9],[4,-.5],[6,-.7]]);p["mouth"]=track([[0,-.8],[2.5,-.8],[4,.6],[6,.8]])
    p["head_tilt"]=track([[0,12],[2.5,16],[4,-4],[6,-6]]);p["blink"]=blink_track(d,3.8)
    seed=carry_seed(p,d);seed["opacity"]=track([[0,0],[2.2,0],[3,1],[6,1]])
    els=[*city(lit=0),*ground(),dict(type="rig",character=CHAR,pose=p),seed,
         *chapter(5,"NOT THE ONLY LIGHT"),*caption("But a seed was still alive.")]
    shots.append(shot("s05",d,els,push(610,390,1,1.08,d)))
    # 06 — Effort montage at the beacon stairs.
    d=6; p=base_pose(330,481,1.0,lean=12,brow=-.8,mouth=.1,arm_r=45)
    p=apply_walk(p,3,.3,5.5,stride=25,bob=6,swing=30)
    p["x"]=tween(330,790,.3,5.5,"linear");p["y"]=tween(481,313,.3,5.5,"linear")
    els=[*stars(),*mountains(),*ground(),stairs(330,385,7,70,28),beacon(920,330,.9,0),
         dict(type="rig",character=CHAR,pose=p),carry_seed(p,d),
         glow(700,450,120,"#a8d6a0",.25),
         *chapter(6,"THE CLIMB"),*caption("So Pip carried that instead.")]
    shots.append(shot("s06",d,els,push(620,380,1,1.05,d)))
    # 07 — Plant the seed. Light blooms from the beacon.
    d=6; p=base_pose(760,440,1.25,brow=-.5,mouth=.5,arm_r=75,head_tilt=-6)
    p["arm_r"]=track([[0,45],[1,75],[2,85],[3,30],[6,28]]);p["lean"]=tween(8,0,1,3)
    p["mouth"]=tween(.3,.9,2,3.5);p["blink"]=blink_track(d,4)
    bloom=track([[0,0],[1.8,0],[2.2,.3],[3.2,1],[6,1]])
    bc=beacon(920,330,1.1,1);bc["children"][2]["fill"]=track([[0,"#36576a"],[1.8,"#36576a"],[2.2,"#e9b44c"],[6,"#e9b44c"]]);bc["children"][2]["opacity"]=bloom
    els=[*stars(),*mountains(),*ground(),bc,
         glow(920,170,500,"#e9b44c",.5,opacity=bloom),
         dict(type="rig",character=CHAR,pose=p),
         dict(type="particles",mode="dust",count=35,speed=35,fill="#e9b44c",opacity=.5,drift=20),
         *chapter(7,"PASS IT ON"),*caption("Some lights are meant to be shared.")]
    shots.append(shot("s07",d,els,push(720,340,1,1.08,d)))
    # 08 — Resolution. City wakes; hold final image.
    d=8; p=base_pose(640,485,1.0,mouth=.9,blush=.3,head_tilt=-4,arm_r=150)
    p["arm_r"]=track([[0,28],[1.2,150],[2,140],[3,150],[8,150]]);p["bob"]=tween(0,-3,0,2)
    p["blink"]=blink_track(d,3)
    els=[*stars(n=20),*city(lit=.85,windows="#e9b44c"),*ground(),
         glow(640,300,650,"#e9b44c",.18),dict(type="rig",character=CHAR,pose=p),
         text(640,150,"THE LAST LIGHT",46,"#f4e8cf",anchor="middle",weight="bold",layer="screen"),
         text(640,195,"Small things carry us.",24,"#e9b44c",anchor="middle",layer="screen"),
         *caption("And the city remembered morning.")]
    shots.append(shot("s08",d,els,push(640,380,1.04,1,d),fade_out=1.2))
    caption_texts=["One small light. A long way home.","Pip promised to keep it burning.","The wind had other plans.","Then, nothing.","But a seed was still alive.","So Pip carried that instead.","Some lights are meant to be shared.","And the city remembered morning."]
    for sh,txt in zip(shots,caption_texts): sh["captions"]=[{"start":.4,"end":sh["duration"]-.4,"text":txt}]
    total=sum(s["duration"] for s in shots)
    # Original procedural score: quiet -> effort -> hope -> quiet.
    build_soundtrack(HERE,total,[(0,"quiet"),(11,"effort"),(23,"quiet"),(29,"effort"),(35,"hope"),(42,"quiet")])
    # Foley cues. Times are shot-local; renderer converts to film time.
    def add(i,name,x,vol=1):
        src=cue(HERE,name,x);shots[i].setdefault("audio",[]).append({"src":src,"start":0,"volume":vol})
    for i in [0,2,5]:
        steps=np.zeros(int(6*SR))
        for k in range(12):
            s=noise(.16,"step",.5,seed=10+k);a=int((.5+k*.43)*SR);steps[a:a+len(s)]+=s[:len(steps)-a]
        add(i,f"steps_{i}.wav",steps,.7)
    add(2,"storm.wav",noise(6,"rain",.35),.6)
    add(3,"storm.wav",noise(5,"rain",.3),.5)
    add(3,"gust.wav",noise(2,"whoosh",.5),.5)
    add(4,"seed.wav",tone(659.25,2,"bell",.3),.7)
    add(6,"bloom.wav",tone(293.66,3,"bell",.35)+tone(440,3,"bell",.2),.7)
    add(7,"dawn.wav",tone(587.33,4,"pad",.15,.5,1),.6)
    spec=dict(title="The Last Light",fps=24,width=1280,height=720,shots=shots,
              audio=[{"src":"audio/score.wav","start":0,"volume":.8}],mix={"loudness":-16})
    (HERE/"film.json").write_text(json.dumps(spec,indent=2))
    return spec

if __name__=="__main__":
    s=build();print(f"Wrote {HERE/'film.json'} — {sum(x['duration'] for x in s['shots'])}s, {len(s['shots'])} shots")
