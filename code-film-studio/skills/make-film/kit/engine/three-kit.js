// engine/three-kit.js — Three.js 3D stage + MC v2 3D character rig & cel/toon helpers for spatial/orbit shots.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { E, S, mood as getMood, rgb, COATS } from './core.js';

export { THREE };
const hex = c => { const [r, g, b] = rgb(c); return new THREE.Color(r / 255, g / 255, b / 255); };

let _ramp = null;
function toonRamp() {
  if (_ramp) return _ramp;
  const d = new Uint8Array([38, 96, 178, 255]);
  _ramp = new THREE.DataTexture(d, 4, 1, THREE.RedFormat); _ramp.needsUpdate = true;
  _ramp.minFilter = _ramp.magFilter = THREE.NearestFilter; return _ramp;
}
export const toonMat = (color, extra = {}) => new THREE.MeshToonMaterial({ color: hex(color), gradientMap: toonRamp(), ...extra });
export const flatMat = (color, extra = {}) => new THREE.MeshBasicMaterial({ color: hex(color), ...extra });
export const glowMat = (color, intensity = 2.2) => new THREE.MeshStandardMaterial({ color: hex(color), emissive: hex(color), emissiveIntensity: intensity, roughness: 0.4 });

// Shared WebGLRenderer + composer, resized automatically to match output resolution
let R = null;
function ensureRenderer() {
  const w = Math.round(E.W * E.PX), h = Math.round(E.H * E.PX);
  if (!R) {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    R = { canvas, renderer, w: 0, h: 0 };
  }
  if (R.w !== w || R.h !== h) { R.renderer.setSize(w, h, false); R.w = w; R.h = h; }
  return R;
}

export function makeStage({ mood = 'dusk', fov = 38, fog = 0.014, bloom = null, ground = true } = {}) {
  const { renderer } = ensureRenderer(); const M = getMood(mood), st = S();
  const scene = new THREE.Scene();
  const skyCol = hex(M.sky[Math.min(1, M.sky.length - 1)]);
  scene.background = skyCol;
  if (fog) scene.fog = new THREE.FogExp2(hex(M.fog || M.sky[M.sky.length - 1]), fog);

  const camera = new THREE.PerspectiveCamera(E.vertical ? fov * 1.32 : fov, E.W / E.H, 0.1, 400);
  camera.position.set(0, 3.2, 11);

  const hemi = new THREE.HemisphereLight(hex(M.sky[M.sky.length - 1]), hex(M.floor), 0.95); scene.add(hemi);
  const key = new THREE.DirectionalLight(hex(M.key), 2.1);
  key.position.set(7, 12, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 50;
  const d = 18; Object.assign(key.shadow.camera, { left: -d, right: d, top: d, bottom: -d });
  scene.add(key);
  const rim = new THREE.DirectionalLight(hex(M.rim), 1.45); rim.position.set(-8, 5, -7); scene.add(rim);

  if (ground) {
    const g = new THREE.Mesh(new THREE.CircleGeometry(120, 48), toonMat(M.floor));
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  }

  const bl = bloom ?? st.grade.bloom;
  const composer = new EffectComposer(renderer);
  composer.setSize(R.w, R.h);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(R.w, R.h), bl * 0.55, 0.65, 0.82);
  composer.addPass(bloomPass); composer.addPass(new OutputPass());

  return {
    scene, camera, key, rim, hemi, mood: M,
    render(targetCtx) {
      camera.aspect = E.W / E.H; camera.updateProjectionMatrix();
      ensureRenderer(); composer.setSize(R.w, R.h); bloomPass.strength = (bloom ?? S().grade.bloom) * 0.55;
      composer.render();
      targetCtx.save(); targetCtx.setTransform(1, 0, 0, 1, 0, 0);
      targetCtx.drawImage(R.canvas, 0, 0, R.w, R.h); targetCtx.restore();
    },
  };
}

export function addOutline(mesh, thickness = 1.045, color = null) {
  const o = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: hex(color || S().ink), side: THREE.BackSide }));
  o.scale.multiplyScalar(thickness); mesh.add(o); return o;
}

// ---------- 3D MC v2 character (1.8 world units tall: shaded coat, black head, 3D oval eyes + brow bars, ball hands) ----------
export function figure3D({ coat = null, rimColor = null, scale = 1, outfit = null } = {}) {
  const root = new THREE.Group();
  const inkMat = flatMat(S().ink);
  const featMat = flatMat(S().feature || '#fff6e6');
  const coatHex = coat || outfit?.color || COATS.cream;
  const coatMat = toonMat(coatHex);

  const limb = (len, r = 0.048) => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 10), inkMat);
    m.position.y = -len / 2; m.castShadow = true; g.add(m);
    return g;
  };

  // Shaded 3D rounded tapered MC v2 tunic/coat (from hip y=0.76 up to neck y=1.44)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.195, 0.68, 20), coatMat);
  torso.position.y = 1.10; torso.castShadow = true; torso.receiveShadow = true;
  // Rounded top shoulder cap
  const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 12), coatMat);
  shoulderCap.scale.set(1, 0.45, 0.85);
  shoulderCap.position.y = 1.43;
  root.add(torso, shoulderCap);

  // Dark neck + circular head + rim outline
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.12, 10), inkMat);
  neckMesh.position.y = 1.49;
  root.add(neckMesh);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.66;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), inkMat);
  head.castShadow = true;
  if (rimColor) addOutline(head, 1.07, rimColor);
  headGroup.add(head);

  // Signature MC v2 face on +Z of headGroup: vertical oval eyes + flat pill brow bars + subtle mouth
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), featMat);
    eye.scale.set(0.95, 1.55, 0.35);
    eye.position.set(sx * 0.052, -0.008, 0.184);
    headGroup.add(eye);

    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.048, 4, 8), featMat);
    brow.rotation.z = Math.PI / 2;
    brow.position.set(sx * 0.052, 0.062, 0.18);
    headGroup.add(brow);
  }
  const mouth = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.028, 4, 8), featMat);
  mouth.rotation.z = Math.PI / 2;
  mouth.position.set(0, -0.068, 0.182);
  headGroup.add(mouth);
  root.add(headGroup);

  // Arms + solid ball hands
  const armL = limb(0.50, 0.042); armL.position.set(0.185, 1.38, 0);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), inkMat);
  handL.position.y = -0.52; armL.add(handL);

  const armR = limb(0.50, 0.042); armR.position.set(-0.185, 1.38, 0);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), inkMat);
  handR.position.y = -0.52; armR.add(handR);

  // Legs + flat forward feet
  const legL = limb(0.72, 0.046); legL.position.set(0.075, 0.76, 0);
  const footL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.17), inkMat);
  footL.position.set(0, -0.74, 0.04); legL.add(footL);

  const legR = limb(0.72, 0.046); legR.position.set(-0.075, 0.76, 0);
  const footR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.17), inkMat);
  footR.position.set(0, -0.74, 0.04); legR.add(footR);

  root.add(armL, armR, legL, legR);
  root.scale.setScalar(scale);

  return {
    root, head: headGroup, torso, armL, armR, legL, legR,
    pose(t, mode = 'idle') {
      if (mode === 'walk' || mode === 'run') {
        const sp = mode === 'run' ? 9 : 5, a = Math.sin(t * sp) * (mode === 'run' ? 0.85 : 0.5);
        legL.rotation.x = a; legR.rotation.x = -a; armL.rotation.x = -a * 0.8; armR.rotation.x = a * 0.8;
        root.position.y = Math.abs(Math.cos(t * sp)) * (mode === 'run' ? 0.12 : 0.04);
      } else {
        const b = Math.sin(t * 2) * 0.03;
        armL.rotation.z = 0.09 + b; armR.rotation.z = -0.09 - b;
        headGroup.position.y = 1.66 + b * 0.4;
      }
    },
  };
}

export function box(w, h, d, color, outline = false) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toonMat(color));
  m.castShadow = m.receiveShadow = true; if (outline) addOutline(m, 1.03); return m;
}
export function tree(color = '#3d6e52', trunk = '#3a2a20', s = 1) {
  const g = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.1 * s, 7), toonMat(trunk));
  tr.position.y = 0.55 * s; tr.castShadow = true; g.add(tr);
  const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85 * s, 0), toonMat(color));
  cr.position.y = 1.65 * s; cr.castShadow = true; g.add(cr); return g;
}

export const orbitCam = (cam, target, radius, azimuth, elevation = 0.35) => {
  cam.position.set(
    target[0] + Math.cos(azimuth) * Math.cos(elevation) * radius,
    target[1] + Math.sin(elevation) * radius,
    target[2] + Math.sin(azimuth) * Math.cos(elevation) * radius
  );
  cam.lookAt(target[0], target[1], target[2]);
};
