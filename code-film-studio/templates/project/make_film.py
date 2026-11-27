"""Starting point for a new Inkframe film. Edit beats, cast, sets and timing."""
import sys, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]  # adjust if copied outside skill
sys.path.insert(0,str(ROOT))
from studio.motion import camera, tween, hold
from studio.scenery import room, ground, text, glow
from studio.audio import build_soundtrack

HERE=Path(__file__).resolve().parent

def build():
    char=dict(name="Lead",sprout=True,satchel=True,costume={})
    pose=dict(x=640,y=490,scale=1.2,mouth=tween(0,.8,.5,2),blink=1)
    d=6
    shots=[dict(id="s01",duration=d,background=["#263849","#172633"],
        camera=camera(duration=d),
        elements=[*room(),dict(type="rig",character=char,pose=pose),
                  text(640,100,"YOUR TITLE",40,"#f4e8cf",anchor="middle",layer="screen")],
        captions=[{"start":.5,"end":5.5,"text":"Your first caption."}])]
    build_soundtrack(HERE,d,[(0,"quiet")])
    spec=dict(title="New Film",fps=24,width=1280,height=720,shots=shots,
              audio=[{"src":"audio/score.wav","start":0,"volume":.7}],mix={"loudness":-16})
    (HERE/"film.json").write_text(json.dumps(spec,indent=2));return spec

if __name__=="__main__": build(); print("Wrote film.json")
