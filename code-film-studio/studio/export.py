"""Caption and delivery helpers. Never invent dialogue timing from text alone."""
from pathlib import Path

def timestamp(t):
    ms=round(t*1000); h,ms=divmod(ms,3600000); m,ms=divmod(ms,60000); s,ms=divmod(ms,1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

def srt(spec,path):
    blocks=[]; offset=0; n=1
    for sh in spec["shots"]:
        caps=sh.get("captions",[])
        if not caps and sh.get("subtitle"): caps=[{"start":.3,"end":sh["duration"]-.3,"text":sh["subtitle"]}]
        for c in caps:
            a=offset+c["start"]; b=offset+c["end"]
            assert 0<=a<b<=offset+sh["duration"]
            blocks.append(f"{n}\n{timestamp(a)} --> {timestamp(b)}\n{c['text']}\n");n+=1
        offset+=sh["duration"]
    Path(path).write_text('\n'.join(blocks)); return path
