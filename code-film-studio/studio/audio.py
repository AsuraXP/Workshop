"""Original procedural score, Foley and ambience; deterministic sample synthesis."""
from __future__ import annotations
import json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy import signal
SR=48000

def envelope(n, attack=.01, release=.08):
    e=np.ones(n); a=min(n,int(attack*SR)); r=min(n,int(release*SR))
    if a: e[:a]=np.linspace(0,1,a)**2
    if r: e[-r:]*=np.linspace(1,0,r)**2
    return e

def tone(freq,duration,kind="sine",volume=.2,attack=.01,release=.08):
    t=np.arange(round(duration*SR))/SR
    phase=2*np.pi*freq*t
    if kind=="bell":
        x=np.sin(phase)*np.exp(-t*5)+.35*np.sin(phase*2.76)*np.exp(-t*9)+.12*np.sin(phase*5.4)*np.exp(-t*13)
    elif kind=="pluck":
        x=(np.sin(phase)+.25*np.sin(2*phase)+.12*np.sin(3*phase))*np.exp(-t*5)
    elif kind=="pad":
        x=np.sin(phase)+.22*np.sin(phase*2.003)+.08*np.sin(phase*3.001)
    elif kind=="bass":
        x=np.sin(phase)+.15*np.sin(phase*2)
    else: x=np.sin(phase)
    return x*envelope(len(x),attack,release)*volume

def noise(duration,kind="rain",volume=.1,seed=42):
    rng=np.random.default_rng(seed); n=round(duration*SR); x=rng.normal(0,1,n)
    if kind=="rain": x=signal.lfilter([.15,.15],[1,-.7],x); x+=rng.normal(0,.12,n)
    elif kind=="wind": x=signal.lfilter([.025],[1,-.975],x); x*=.7+.3*np.sin(np.arange(n)/SR*1.7)
    elif kind=="step":
        x=signal.lfilter([.1],[1,-.9],x); x*=np.exp(-np.arange(n)/SR*35)
    elif kind=="whoosh":
        x=signal.lfilter([.08],[1,-.92],x); x*=np.sin(np.pi*np.arange(n)/n)**2
    elif kind=="click": x*=np.exp(-np.arange(n)/SR*90)
    return x*envelope(n,.03,.1)*volume

def score(duration,sections=None,seed=7):
    """Original pentatonic motif, changing harmony and orchestration by section."""
    n=round(duration*SR); out=np.zeros(n); t=np.arange(n)/SR
    sections=sections or [(0,"quiet"),(duration*.35,"effort"),(duration*.7,"hope"),(duration*.9,"quiet")]
    roots=[146.83,130.81,174.61,164.81] # D3 C3 F3 E3
    beat=.75
    for k in range(int(duration/beat)+1):
        start=k*beat; i=round(start*SR)
        if i>=n: break
        sec=sections[0][1]
        for st,mood in sections:
            if start>=st: sec=mood
        root=roots[(k//8)%4]
        if k%4==0:
            for ratio in [1,1.5,2]:
                s=tone(root*ratio,min(3.2,duration-start),"pad",.045,.4,.8)
                out[i:i+len(s)]+=s[:n-i]
        motif=[0,2,4,2,1,4,3,2]
        degree=motif[k%8]; ratio=[1,9/8,5/4,4/3,3/2,2,9/4,5/2][degree]
        vol={"quiet":.055,"effort":.075,"hope":.10,"silence":0}.get(sec,.06)
        s=tone(root*2*ratio,min(1.8,duration-start),"bell" if sec=="hope" else "pluck",vol,.005,.3)
        out[i:i+len(s)]+=s[:n-i]
        if sec in ("effort","hope") and k%2==0:
            s=tone(root/2,.5,"bass",.075,.01,.15); out[i:i+len(s)]+=s[:n-i]
    return out*envelope(n,1.2,2.0)

def build_soundtrack(project,duration,sections=None):
    """Write a self-contained score + ambience bed. Returns relative path."""
    project=Path(project); audio=project/"audio"; audio.mkdir(parents=True,exist_ok=True)
    x=score(duration,sections)
    amb=noise(duration,"wind",.045)
    x[:len(amb)]+=amb
    sf.write(audio/"score.wav",np.clip(x,-.95,.95),SR)
    return "audio/score.wav"

def cue(project,name,x,volume=1):
    p=Path(project)/"audio"/name; p.parent.mkdir(parents=True,exist_ok=True)
    sf.write(p,np.clip(x*volume,-.95,.95),SR); return f"audio/{name}"

def mix(spec,out,silent):
    """FFmpeg cue mixing + two-pass loudness normalization. All sources local."""
    base=Path(spec.get("_base",".")); inputs=["-i",str(silent)]; filters=[]; labels=[]
    events=[]
    for a in spec.get("audio",[]): events.append((float(a.get("start",0)),a))
    offset=0
    for sh in spec["shots"]:
        for a in sh.get("audio",[]): events.append((offset+float(a.get("start",0)),a))
        offset+=sh["duration"]
    for j,(start,a) in enumerate(events):
        inputs+=["-i",str(base/a["src"])]; idx=j+1
        delay=round(start*1000); gain=float(a.get("volume",1))
        filters.append(f"[{idx}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={gain},adelay={delay}:all=1[a{j}]")
        labels.append(f"[a{j}]")
    if labels:
        filters.append(''.join(labels)+f'amix=inputs={len(labels)}:duration=longest:normalize=0,atrim=0:{offset},loudnorm=I={spec.get("mix",{}).get("loudness",-16)}:TP=-1.5:LRA=11[mix]')
        cmd=["ffmpeg","-y","-loglevel","error",*inputs,"-filter_complex",';'.join(filters),"-map","0:v","-map","[mix]","-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000","-t",str(offset),"-movflags","+faststart",str(out)]
    else:
        cmd=["ffmpeg","-y","-loglevel","error","-i",str(silent),"-f","lavfi","-i","anullsrc=r=48000:cl=stereo","-map","0:v","-map","1:a","-c:v","copy","-c:a","aac","-shortest",str(out)]
    subprocess.run(cmd,check=True)
    return out
