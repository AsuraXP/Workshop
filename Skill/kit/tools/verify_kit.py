#!/usr/bin/env python3
"""Verify that shared Code Film Studio kit files have not been accidentally modified or corrupted."""
import hashlib, sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent

EXPECTED = {
    "audio/dsp.py": "ef359cab27aec03e66b6471ee11189e5ebf753413d3c70764f44c8edb0d558ad",
    "audio/mix.py": "d0b615bca5abf2d314f27c7991f8843baf481e7606c7ba1893fc22f476d31949",
    "audio/music.py": "18261cd1c1983a202d246f64f7f181e95454d6ef597b68042a2647a615ee916f",
    "audio/sfx.py": "6fdf4263c3cced1e8e5f945933e16e773c4e5e50963c4ed68b1a2f0aff6206e8",
    "audio/tts.py": "f17efe6586acf1bb8018a0c1dfa24a4b0132ca312b287d3034d4b2ad575f3a5b",
    "engine/compositor.js": "e6e4c3fe2e86d11cf3d19d441aaede8ebb81c97c15b29a336530eb978dedec09",
    "engine/core.js": "f10644503415f9cce22dc0d42cb3fa271f17775e931a7928d8b7e51fd05df12d",
    "engine/fx2d.js": "03601d8638ebddd2f76f8ac821c5b361ec6c969485d3cc4da3a0312e9807dc78",
    "engine/player.js": "6bb02b8ba35e6a2aeffc62e68866abcbf2b787c33fa60cc65f16fd9324a21219",
    "engine/rig2d.js": "79860d9f3e08e8aa5033b0607c7bf6808ad3785d138680b2aa63cf1bcd3472ab",
    "engine/styles.js": "d5b0dcdeb8ede9c040701ffea4f5a09fda452a620ee56661365676135fceb423",
    "engine/three-kit.js": "2f10968e2a1d7f9f21f4e1bf7345a4d340dff8588bfbececf655bfe0c82b5dc5",
    "engine/ui2d.js": "bb03f000fa5bb7b38178e9df9ea191981abcd11e15305f1ba8107c7ea6c56503",
    "package.json": "3f28331567d901f19d5ee091b03bfb2486542b675366137f619f9cc934831d78",
    "player.html": "e59d25da876da2fcb3185b7f5e9283f19c043f9839cb88a0f23499ce56a655fa",
    "render.mjs": "5ad8dbf0bc4ab6d79c4604fa71b093aa418cc418283952bc8657734a708bcdc7",
    "serve.mjs": "6608f3a9f3ee3ff450b5ac97a364f6a3d632bc54d7d81d22e10df55bba820ffe",
    "tools/common.py": "a56bdf771927e53195727fdf4b9bd47d9bbf325f660d5578db437df41738baeb",
    "tools/doctor.py": "529486277ee2210589738c8557177dabf70c59ca7da9682952a63bcaaff95379",
    "tools/export_srt.py": "c6e09202f72e043facc023dbf5a20af4c7c43115f18583e677fb1768be455562",
    "tools/new_project.py": "878a2ed7fe0d36f6e1ec2ed3bd34fe6733fcae35573ccf1ae83df597540fc102",
    "tools/plan_timeline.py": "1b30fa63b8d059e653b4a175b7246e8a9300b6cc1da544e8be7a6a71369bc2a5",
    "tools/qa.py": "c2b18b91cf60a8ed847c53f6d22db6e284bcf97408365ac7e6e2c94e1bea6c06",
    "tools/thumbnail.py": "43bd4f5b5dd2dc1293d39b271d862187b097102bb0a09e8e301e8a301c81ce55",
}


def main():
    bad = []
    for rel, exp in EXPECTED.items():
        p = KIT / rel
        if not p.exists():
            bad.append(f"MISSING: {rel}")
            continue
        digest = hashlib.sha256(p.read_bytes()).hexdigest()
        if digest != exp:
            bad.append(f"MODIFIED: {rel} (expected {exp[:12]}..., got {digest[:12]}...)")
    if bad:
        print("Code Film Studio kit integrity check FAILED:")
        for b in bad:
            print(f"  - {b}")
        sys.exit(1)
    print(f"Kit integrity verified ({len(EXPECTED)} core files clean).")


if __name__ == "__main__":
    main()
