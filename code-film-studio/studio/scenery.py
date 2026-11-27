"""Reusable code-drawn sets and props. All coordinates are world-space pixels."""
from __future__ import annotations
import math

def rect(x,y,w,h,fill,**kw): return dict(type="rect",x=x,y=y,w=w,h=h,fill=fill,**kw)
def ellipse(cx,cy,rx,ry,fill,**kw): return dict(type="ellipse",cx=cx,cy=cy,rx=rx,ry=ry,fill=fill,**kw)
def path(d,fill="none",**kw): return dict(type="path",d=d,fill=fill,**kw)
def line(x1,y1,x2,y2,stroke,width=2,**kw): return dict(type="line",x1=x1,y1=y1,x2=x2,y2=y2,stroke=stroke,stroke_width=width,linecap="round",**kw)
def text(x,y,text,size=24,fill="#f4e8cf",**kw): return dict(type="text",x=x,y=y,text=text,size=size,fill=fill,**kw)
def glow(cx,cy,r,fill="#e9b44c",strength=.4,**kw): return dict(type="glow",cx=cx,cy=cy,r=r,fill=fill,strength=strength,**kw)

def city(distant="#263e50",near="#1b2e3e",windows="#e9b44c",lit=0,seed=3):
    out=[]
    for layer in range(2):
        color=distant if layer==0 else near
        base=535 if layer==0 else 610
        for i in range(15):
            x=i*105-80+layer*37; h=90+((i*47+seed*19+layer*31)%170)
            out.append(rect(x,base-h,83,h+160,color))
            if i%3==0: out.append(path(f"M{x-4},{base-h} L{x+41},{base-h-28} L{x+87},{base-h} Z",color))
            for row in range(h//35):
                for col in range(2):
                    on=((i*7+row*3+col+seed)%10)/10 < lit
                    out.append(rect(x+17+col*33,base-h+20+row*35,12,17,windows if on else "#365061",opacity=.85 if on else .35,radius=2))
    return out

def room(wall="#263849",floor="#172633",accent="#e9b44c"):
    return [rect(0,530,1280,190,floor),line(0,530,1280,530,"#3b5060",3),
            rect(90,135,240,270,"#152737",radius=8),rect(105,150,210,240,"#36576a",radius=4),
            line(210,150,210,390,wall,10),line(105,270,315,270,wall,10),
            rect(820,390,300,18,"#765744",radius=5),rect(845,408,18,140,"#5c4437"),rect(1075,408,18,140,"#5c4437"),
            rect(930,290,70,100,"#314b59",radius=5),line(965,290,965,245,accent,5),glow(965,245,150,accent,.25)]

def mountains(fill="#294653"):
    return [path("M-200,570 L80,270 L260,480 L470,190 L730,510 L960,245 L1480,590 Z",fill),
            path("M-200,650 L180,420 L390,600 L650,360 L900,580 L1120,390 L1480,650 Z","#1d3543")]

def ground(fill="#142733",y=590):
    return [rect(-300,y,1900,500,fill),line(-300,y,1600,y,"#365461",3)]

def lantern(x,y,scale=1,lit=1,angle=0):
    return dict(type="group",transform=f"translate({x} {y}) scale({scale}) rotate({angle})",children=[
        glow(0,0,100,"#e9b44c",.45*lit),
        path("M-13,-22 Q-18,-43 0,-43 Q18,-43 13,-22",stroke="#bd8a58",stroke_width=5),
        rect(-20,-24,40,52,"#263849",radius=7),
        rect(-14,-17,28,37,"#e9b44c" if lit>.2 else "#405463",radius=5,opacity=max(.25,lit)),
        path("M0,13 C-12,4 -5,-8 0,-13 C5,-5 12,4 0,13 Z","#fff1bd",opacity=lit),
        line(-20,-24,20,-24,"#bd8a58",5),line(-20,28,20,28,"#bd8a58",5)])

def beacon(x,y,scale=1,lit=0):
    return dict(type="group",transform=f"translate({x} {y}) scale({scale})",children=[
        glow(0,-150,330,"#e9b44c",.55*lit),
        path("M-48,130 L-30,-95 L30,-95 L48,130 Z","#314b59"),
        rect(-44,-170,88,80,"#172633",radius=8),
        rect(-32,-160,64,58,"#e9b44c" if lit>.1 else "#36576a",radius=5,opacity=max(.3,lit)),
        path("M-58,-170 L0,-215 L58,-170 Z","#bd8a58"),
        rect(-60,-95,120,14,"#bd8a58",radius=4),
        rect(-18,45,36,85,"#142733",radius=15),
        line(-40,100,40,100,"#47616b",4)])

def stairs(x,y,steps=7,w=70,h=28):
    pts=f"M{x},{y+steps*h} "; xx=x; yy=y+steps*h
    for i in range(steps):
        pts+=f"L{xx},{yy-h} L{xx+w},{yy-h} ";xx+=w;yy-=h
    pts+=f"L{xx},{y+steps*h+200} L{x},{y+steps*h+200} Z"
    return path(pts,"#314b59")

def stars(seed=5,n=35):
    return [ellipse((i*173+seed*41)%1280,30+(i*67)%300,1.5+(i%3)*.5,1.5+(i%3)*.5,"#d7e5df",opacity=.25+(i%4)*.12) for i in range(n)]
