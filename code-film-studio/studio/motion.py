"""Deterministic, shot-local animation tracks. No generated imagery."""
from __future__ import annotations
import math
from typing import Any

EASES = {
    "linear": lambda u: u,
    "smooth": lambda u: u*u*(3-2*u),
    "cubic": lambda u: u*u*u*(4-3*u),
    "in": lambda u: u*u*u,
    "out": lambda u: 1-(1-u)**3,
    "back": lambda u: 1 + 2.70158*(u-1)**3 + 1.70158*(u-1)**2,
}

def ease(name="smooth"):
    if name not in EASES: raise ValueError(f"Unknown easing {name}")
    return EASES[name]

def track(keys, default=None):
    """Keys: [[shot-local seconds, value, optional easing], ...]."""
    if not isinstance(keys, list): return keys
    if not keys: raise ValueError("Empty track")
    ks = sorted(keys, key=lambda k: k[0])
    if any(not math.isfinite(float(k[0])) for k in ks): raise ValueError("Nonfinite key time")
    if len({k[0] for k in ks}) != len(ks): raise ValueError("Duplicate key time")
    return {"keys": ks, "default": default}

def sample(value: Any, t: float):
    if isinstance(value, dict) and "keys" in value:
        ks = value["keys"]
        if t <= ks[0][0]: return ks[0][1]
        if t >= ks[-1][0]: return ks[-1][1]
        for a,b in zip(ks,ks[1:]):
            if a[0] <= t <= b[0]:
                u = (t-a[0])/(b[0]-a[0])
                u = ease(b[2] if len(b)>2 else "smooth")(u)
                if isinstance(a[1], (int,float)) and isinstance(b[1], (int,float)):
                    return a[1]+(b[1]-a[1])*u
                if isinstance(a[1], str) and a[1].startswith("#"):
                    return mix_color(a[1], b[1], u)
                if isinstance(a[1], (list,tuple)):
                    return [sample(track([[0,x],[1,y]]),u) for x,y in zip(a[1],b[1])]
                return b[1] if u >= .5 else a[1]
    if isinstance(value, list): return [sample(v,t) for v in value]
    if isinstance(value, dict): return {k:sample(v,t) for k,v in value.items() if k not in ("keys","default")}
    return value

def mix_color(a,b,t):
    def rgb(s):
        s=s.lstrip('#')
        if len(s)==3: s=''.join(c*2 for c in s)
        return tuple(int(s[i:i+2],16) for i in (0,2,4))
    x,y=rgb(a),rgb(b)
    return '#'+ ''.join(f'{round(x[i]+(y[i]-x[i])*t):02x}' for i in range(3))

def tween(start,end,a=0,b=1,easing="smooth"):
    return track([[a,start],[b,end,easing]])

def hold(value, duration): return track([[0,value],[duration,value]])

def pulse(base,peak,start,attack=.12,release=.35):
    return track([[start,base],[start+attack,peak,"out"],[start+attack+release,base,"smooth"]])

def camera(cx=640,cy=360,zoom=1,rotate=0,duration=1):
    return {k:hold(v,duration) for k,v in dict(cx=cx,cy=cy,zoom=zoom,rotate=rotate).items()}

def push(cx,cy,z0,z1,duration,cy1=None):
    return dict(cx=hold(cx,duration),cy=tween(cy,cy if cy1 is None else cy1,0,duration),zoom=tween(z0,z1,0,duration),rotate=hold(0,duration))

def walk(cycles=1, stride=24, bob=5, swing=32):
    """Eight poses per cycle; returns normalized joint tracks over one second."""
    poses=[]
    for i in range(8*cycles+1):
        phase=2*math.pi*i/8
        s=math.sin(phase)
        poses.append([i/(8*cycles), dict(leg_l=s*stride,leg_r=-s*stride,
            arm_l=-s*swing*.75,arm_r=s*swing*.75,bob=-abs(math.cos(phase))*bob,
            lean=3*math.sin(phase),scarf_lag=math.sin(phase-.6)*8)])
    return poses

def apply_walk(pose, cycles, start, end, stride=24, bob=5, swing=32):
    out=dict(pose)
    frames=walk(cycles,stride,bob,swing)
    for k in frames[0][1]:
        out[k]=track([[start+v*(end-start),p[k]] for v,p in frames])
    return out

def offset_keys(keys, shot_start):
    """Convert absolute film keys to shot-local keys, rejecting out-of-shot keys."""
    raise NotImplementedError("Use local() with explicit duration; never silently clamp keys")

def local(keys, shot_start, duration):
    out=[]
    for k in keys:
        t=k[0]-shot_start
        if t < -1e-6 or t > duration+1e-6: raise ValueError(f"Key outside shot: {k}")
        out.append([max(0,min(duration,t)),*k[1:]])
    return track(out)
