"""Reusable, code-drawn 2D character rig. Coordinates: feet near y=+100."""
from __future__ import annotations
import math
from .motion import sample

DEFAULT_COSTUME = dict(body="#243447", face="#f4e8cf", accent="#e9b44c",
    boots="#172333", scarf="#e9b44c", satchel="#9c6b45", sprout="#8fb89a")

def rig(character, pose, t=0):
    """Return an SVG group. Pose values may be tracks; character is a design dict."""
    p=sample(pose,t); c={**DEFAULT_COSTUME,**character.get("costume",{})}
    x,y=p.get("x",640),p.get("y",510); s=p.get("scale",1)
    lean=p.get("lean",0); bob=p.get("bob",0); squash=p.get("squash",1)
    flip=-1 if p.get("facing",1)<0 else 1
    head=character.get("head_scale",1)
    out=[f'<g transform="translate({x:.3f} {y+bob:.3f}) scale({s*flip:.4f} {s*squash:.4f})" opacity="{p.get("opacity",1)}">']
    def line(x1,y1,x2,y2,color,width):
        out.append(f'<path d="M{x1:.2f},{y1:.2f} L{x2:.2f},{y2:.2f}" stroke="{color}" stroke-width="{width}" stroke-linecap="round" fill="none"/>')
    def joint(ox,oy,angle,length):
        a=math.radians(angle)
        return ox+math.sin(a)*length, oy+math.cos(a)*length
    # Legs behind torso; 0 degrees points down, positive swings right.
    for side,key in [(-1,"leg_l"),(1,"leg_r")]:
        hx=side*15; ex,ey=joint(hx,28,p.get(key,side*5),53)
        line(hx,28,ex,ey,c["body"],19)
        out.append(f'<ellipse cx="{ex+5:.2f}" cy="{ey+3:.2f}" rx="17" ry="10" fill="{c["boots"]}"/>')
    # Far arm.
    ax,ay=joint(-29,-48,p.get("arm_l",-12),57)
    line(-29,-48,ax,ay,c["body"],16)
    out.append(f'<circle cx="{ax:.2f}" cy="{ay:.2f}" r="10" fill="{c["face"]}"/>')
    out.append(f'<g transform="rotate({lean:.2f} 0 20)">')
    # Signature pear silhouette, not a stock stick figure.
    out.append(f'<path d="M-29,-66 C-43,-43 -45,-2 -34,24 C-24,43 25,43 35,23 C45,-3 39,-46 27,-66 Z" fill="{c["body"]}"/>')
    out.append(f'<path d="M-26,-51 C-31,-28 -30,-4 -24,9" fill="none" stroke="#ffffff" stroke-opacity=".09" stroke-width="5" stroke-linecap="round"/>')
    # Satchel and strap remain attached under head motion.
    if character.get("satchel",True):
        line(-24,-62,30,15,c["satchel"],7)
        out.append(f'<rect x="20" y="-3" width="32" height="35" rx="8" fill="{c["satchel"]}"/><path d="M22,3 H50 V14 Q36,23 22,14 Z" fill="#bd8a58"/>')
    # Scarf: tail follows action with an explicit lag track.
    lag=p.get("scarf_lag",0)
    out.append(f'<path d="M-22,-65 Q-49,-63 { -62-lag:.2f},{-48+lag*.3:.2f} L{-54-lag:.2f},{-36+lag*.3:.2f} Q-35,-48 -13,-53 Z" fill="{c["scarf"]}"/>')
    out.append(f'<rect x="-30" y="-72" width="61" height="15" rx="7" fill="{c["scarf"]}"/>')
    # Head is a separate performance layer.
    tilt=p.get("head_tilt",0)
    out.append(f'<g transform="translate({p.get("head_x",0):.2f} {p.get("head_y",-105):.2f}) rotate({tilt:.2f}) scale({head})">')
    out.append('<path d="M-43,-8 C-44,-34 -24,-48 1,-47 C29,-47 46,-29 44,-3 C43,24 25,37 0,36 C-25,36 -43,20 -43,-8 Z" fill="'+c["body"]+'"/>')
    out.append('<path d="M-34,-7 C-34,-27 -18,-34 0,-32 C19,-34 35,-25 35,-6 C35,15 20,27 0,27 C-20,27 -34,14 -34,-7 Z" fill="'+c["face"]+'"/>')
    if character.get("sprout",True):
        out.append(f'<path d="M0,-45 Q-3,-61 5,-69" stroke="{c["sprout"]}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M3,-60 Q-18,-76 -19,-59 Q-10,-49 3,-60 M4,-65 Q10,-83 23,-76 Q24,-62 4,-65" fill="{c["sprout"]}"/>')
    blink=p.get("blink",1); gaze=p.get("gaze",0)
    for side in [-1,1]:
        ex=side*15
        out.append(f'<ellipse cx="{ex}" cy="-3" rx="6.5" ry="{max(.8,9*blink):.2f}" fill="#172333"/>')
        if blink>.4: out.append(f'<circle cx="{ex+gaze*2:.2f}" cy="-6" r="2" fill="#fff8e7"/>')
    brow=p.get("brow",0) # positive worried, negative determined
    for side in [-1,1]:
        inner=side*8; outer=side*23
        yi=-17+brow*5; yo=-17-brow*5
        line(inner,yi,outer,yo,c["body"],4)
    mouth=p.get("mouth",0) # -1 sad, 0 neutral, +1 smile
    open_m=p.get("open_mouth",0)
    if open_m>.05:
        out.append(f'<ellipse cx="0" cy="15" rx="6" ry="{3+open_m*6:.2f}" fill="#172333"/>')
    else:
        out.append(f'<path d="M-9,{14-mouth*3:.2f} Q0,{14+mouth*8:.2f} 9,{14-mouth*3:.2f}" stroke="#172333" stroke-width="3.5" fill="none" stroke-linecap="round"/>')
    if p.get("blush",0):
        for side in [-1,1]: out.append(f'<ellipse cx="{side*25}" cy="11" rx="7" ry="4" fill="#df927c" opacity="{p["blush"]}"/>')
    out.append('</g></g>')
    # Near arm can reach independently; shoulder rotates, hand follows an arc.
    ax,ay=joint(29,-48,p.get("arm_r",12),57)
    line(29,-48,ax,ay,c["body"],17)
    out.append(f'<circle cx="{ax:.2f}" cy="{ay:.2f}" r="10" fill="{c["face"]}"/>')
    out.append('</g>')
    return ''.join(out)

def hand_position(pose,t=0):
    p=sample(pose,t); a=math.radians(p.get("arm_r",12))
    s=p.get("scale",1); flip=-1 if p.get("facing",1)<0 else 1
    return p.get("x",640)+flip*s*(29+math.sin(a)*57),p.get("y",510)+p.get("bob",0)+s*(-48+math.cos(a)*57)
