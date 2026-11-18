// Shared parts for BatClear: a small flapping bat and moth, expanding sound shells, a call-shape function
// for the spectrograms, and flat canvas panels that sit in the 3D scene and always face the camera.
// Sound is shown in slow motion (about 40 times slower than real) so you can watch it travel.
import { THREE, M, sphere, canvasTexture, clamp, lerp, smooth } from './kit.js';

export { clamp, lerp, smooth, THREE, M, sphere };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const C = 343;                       // speed of sound in air, m/s (about 20 C)
export const SLOW = 40;                     // how much slower than real the sound is drawn
export const VS = C / SLOW;                 // drawn sound speed, scene units (metres) per second
export const COL = { lime: 0xa3e635, amber: 0xffb547, coral: 0xff7a59, cyan: 0x8ef0ff, violet: 0xc49bff, fur: 0x5b4636, fur2: 0x3a2d24, bark: 0x6a5238, leaf: 0x3f7d4a, stone: 0x8a8f9c, moth: 0xd8c7a0 };
export const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export const FONT = (px, w = 400) => `${w} ${Math.round(px * 1.18)}px Geist, ui-sans-serif, system-ui, sans-serif`;
export const MONO = (px) => `${px}px "Geist Mono", ui-monospace, monospace`;

// ---------------------------------------------------------------- call shape
// Instantaneous frequency (kHz) at fraction u (0..1) of a call, for three kinds of call.
// pitch is the frequency in the loudest middle part.
export function callFreq(u, kind, pitch) {
  u = clamp(u, 0, 1);
  if (kind === 'fm') return lerp(pitch * 1.5, pitch * 0.62, Math.pow(u, 0.8));          // steep downward sweep, about an octave
  if (kind === 'qcf') return lerp(pitch * 1.12, pitch * 0.9, u);                           // shallow sweep
  // constant frequency with a short rising start and a short falling tail (horseshoe style)
  if (u < 0.08) return lerp(pitch * 0.9, pitch, u / 0.08);
  if (u > 0.88) return lerp(pitch, pitch * 0.72, (u - 0.88) / 0.12);
  return pitch;
}
// Colour that follows frequency: violet (high) through cyan to lime (low).
export function freqColor(f) { const k = clamp((f - 15) / 140, 0, 1); return new THREE.Color().setHSL(lerp(0.28, 0.75, k), 0.85, 0.6); }

// ---------------------------------------------------------------- a bat that faces +x
export function makeBat(s = 1, { earSize = 1, noseleaf = false, color = COL.fur, wings: withWings = true } = {}) {
  const g = new THREE.Group();
  const fur = M.matte(color, { roughness: 0.9 }), skin = M.matte(0x3a2c24, { side: THREE.DoubleSide, roughness: 1, envMapIntensity: 0.25 });
  const body = sphere(0.2 * s, fur, 20); body.scale.set(1.5, 0.85, 0.85); body.position.x = -0.02 * s;
  const head = sphere(0.14 * s, fur, 20); head.scale.set(1.1, 1, 1); head.position.set(0.3 * s, 0.03 * s, 0);
  const snout = sphere(0.07 * s, M.matte(0x6b5144), 12); snout.scale.set(1.2, 0.8, 1); snout.position.set(0.42 * s, 0.0, 0);
  const mouth = sphere(0.035 * s, M.matte(0x120c0c), 10); mouth.position.set(0.47 * s, -0.01 * s, 0);
  g.add(body, head, snout, mouth);
  for (const z of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09 * s * earSize, 0.3 * s * earSize, 14, 1, true), skin);
    ear.position.set(0.27 * s, 0.17 * s * (0.8 + 0.2 * earSize), z * 0.085 * s); ear.rotation.x = -z * 0.42; ear.rotation.z = 0.15; g.add(ear);
    const eye = sphere(0.016 * s, M.glow(0x050505), 8); eye.position.set(0.4 * s, 0.07 * s, z * 0.065 * s); g.add(eye);
  }
  if (noseleaf) { const leaf = new THREE.Mesh(new THREE.TorusGeometry(0.045 * s, 0.014 * s, 8, 20, Math.PI * 1.5), M.matte(0x8a6b5a)); leaf.position.set(0.48 * s, 0.015 * s, 0); leaf.rotation.y = Math.PI / 2; leaf.rotation.z = Math.PI * 0.75; g.add(leaf); }
  // wings: an inner and an outer panel per side
  const mk = (pts) => { const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x * s * 1.25, y * s * 1.25))); const gm = new THREE.ShapeGeometry(sh); gm.rotateX(Math.PI / 2); const m = new THREE.Mesh(gm, skin); m.castShadow = true; return m; };
  const wrist = [0.02, 0.42];
  const inner = [[0.12, 0], [0.1, 0.3], wrist, [-0.12, 0.32], [-0.26, 0.3], [-0.34, 0.14], [-0.3, 0]];
  const outer = [[0, 0], [0.02, 0.2], [0.0, 0.5], [-0.1, 0.36], [-0.2, 0.22], [-0.28, 0.08], [-0.28 + 0.02, -0.12]].map(([x, y]) => [x, y]);
  const wings = [];
  for (const side of [1, -1]) {
    const root = new THREE.Group(); root.position.set(0.04 * s, 0.07 * s, side * 0.1 * s); root.scale.z = side;
    root.add(mk(inner));
    const out = new THREE.Group(); out.position.set(wrist[0] * s * 1.25, 0, wrist[1] * s * 1.25); out.add(mk(outer));
    root.add(out); if (withWings) g.add(root); wings.push({ root, out, side });
  }
  g.flap = (phase, amp = 0.75) => { wings.forEach((w) => { w.root.rotation.x = w.side * Math.sin(phase) * amp; w.out.rotation.x = Math.sin(phase - 0.9) * amp * 0.9 * 1; }); };
  g.mouth = mouth;
  g.flap(0);
  return g;
}

// ---------------------------------------------------------------- a moth that faces +x
export function makeMoth(s = 1, { color = COL.moth, mark = 0x7a6240 } = {}) {
  const g = new THREE.Group();
  const body = sphere(0.07 * s, M.matte(0x6b5a44), 12); body.scale.set(2, 0.7, 0.7);
  const head = sphere(0.04 * s, M.matte(0x6b5a44), 10); head.position.x = 0.15 * s;
  g.add(body, head);
  for (const z of [-1, 1]) { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.003 * s, 0.003 * s, 0.2 * s, 4), M.matte(0x6b5a44)); an.position.set(0.24 * s, 0.05 * s, z * 0.05 * s); an.rotation.set(z * 0.6, 0, -1.1); g.add(an); }
  const wmat = M.matte(color, { side: THREE.DoubleSide, roughness: 0.9 }), dot = M.matte(mark, { side: THREE.DoubleSide });
  const wings = [];
  for (const side of [1, -1]) {
    const sh = new THREE.Shape([[0.07, 0], [0.12, 0.2], [0.02, 0.34], [-0.12, 0.3], [-0.2, 0.14], [-0.16, 0]].map(([x, y]) => new THREE.Vector2(x * s * 1.1, y * s * 1.1)));
    const gm = new THREE.ShapeGeometry(sh); gm.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(gm, wmat); const root = new THREE.Group(); root.position.set(0, 0.04 * s, side * 0.03 * s); root.scale.z = side;
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.035 * s, 10), dot); spot.rotation.x = Math.PI / 2; spot.position.set(-0.03 * s, 0.002 * s, 0.17 * s);
    root.add(m, spot); g.add(root); wings.push({ root, side });
  }
  g.flap = (phase, amp = 0.95) => wings.forEach((w) => { w.root.rotation.x = w.side * Math.sin(phase) * amp; });
  g.flap(0);
  return g;
}

// ---------------------------------------------------------------- sound shells
// Pooled translucent spheres (or cones) that grow at the drawn sound speed and fade out.
// Everything is a function of the clock you pass in, so scrubbing and the director both work.
export class Pulses {
  constructor(parent, n = 24, { cone = 0.9, flat = false } = {}) {
    this.items = [];
    const full = flat ? new THREE.RingGeometry(0.965, 1, 72).rotateX(-Math.PI / 2) : new THREE.SphereGeometry(1, 36, 18);
    const cap = new THREE.SphereGeometry(1, 36, 14, 0, Math.PI * 2, 0, cone); cap.rotateZ(-Math.PI / 2);
    for (let i = 0; i < n; i++) {
      const mesh = new THREE.Mesh(full, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      mesh.visible = false; mesh.frustumCulled = false; parent.add(mesh);
      this.items.push({ mesh, p: null });
    }
    this.full = full; this.cap = cap;
  }
  clear() { this.items.forEach((it) => { it.p = null; it.mesh.visible = false; }); }
  // p: { pos:[x,y,z], dir:[x,y,z]|null, t0, speed, max, color, amp, thick }
  spawn(p) {
    const it = this.items.find((x) => !x.p) || this.items.reduce((a, b) => (a.p.t0 < b.p.t0 ? a : b));
    it.p = { dir: null, amp: 0.35, speed: VS, max: 12, color: 0xffffff, ...p };
    it.mesh.geometry = p.dir ? this.cap : this.full;
    it.mesh.material.color.set(it.p.color);
    it.mesh.position.set(...p.pos);
    if (p.dir) it.mesh.quaternion.setFromUnitVectors(V(1, 0, 0), V(...p.dir).normalize()); else it.mesh.quaternion.identity();
    return it.p;
  }
  update(now) {
    for (const it of this.items) {
      const p = it.p; if (!p) continue;
      const age = now - p.t0, r = age * p.speed;
      if (age < 0 || r > p.max) { it.mesh.visible = false; if (age >= 0) it.p = null; continue; }
      it.mesh.visible = true; it.mesh.scale.setScalar(Math.max(0.001, r));
      it.mesh.material.opacity = p.amp * Math.pow(1 - r / p.max, 1.4) * Math.min(1, age * 8);
    }
  }
}

// ---------------------------------------------------------------- flat panels that face the camera
export function panel(stage, w, h, pxW, pxH, draw) {
  const { tex, redraw } = canvasTexture(pxW, pxH, draw);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }));
  mesh.renderOrder = 20; mesh.frustumCulled = false;
  mesh.face = () => mesh.quaternion.copy(stage.camera.quaternion);
  mesh.redraw = redraw;
  return mesh;
}

// A panel fixed to the camera (a heads-up display) so it stays in the same corner however you orbit.
// wFrac: width as a fraction of the view; top: distance from the top edge as a fraction of the view height.
const HUDS = new Set();
export function clearHuds() { HUDS.forEach((m) => { m.parent?.remove(m); m.material.map?.dispose(); m.material.dispose(); m.geometry.dispose(); }); HUDS.clear(); }
export function hud(stage, pxW, pxH, draw, { wFrac = 0.42, top = 0.075 } = {}) {
  const { tex, redraw } = canvasTexture(pxW, pxH, draw);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, pxH / pxW), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
  mesh.renderOrder = 999; mesh.frustumCulled = false; mesh.redraw = redraw;
  if (!stage.camera.parent) stage.scene.add(stage.camera);
  stage.camera.add(mesh); HUDS.add(mesh);
  mesh.dock = () => {
    const cam = stage.camera, D = 10, hh = D * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), hw = hh * cam.aspect;
    const w = wFrac * 2 * hw, h = w * (pxH / pxW);
    mesh.scale.set(w, w, 1);
    mesh.position.set(hw - w / 2 - 0.03 * 2 * hw * 0.5, hh - h / 2 - top * 2 * hh, -D);
  };
  mesh.dock();
  return mesh;
}

// Rounded dark card with a title, the backdrop of every panel.
export function card(g, w, h, title) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(8,10,16,0.86)'; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 18); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 2; g.stroke();
  if (title) { g.fillStyle = '#a8aebf'; g.font = FONT(Math.round(h * 0.062), 500); g.textAlign = 'left'; g.fillText(title, 22, h * 0.1); }
}

// A spectrogram: time across (0..tMax ms), frequency up (0..fMax kHz). shown = how much of the call is drawn (0..1).
export function drawSpec(g, w, h, { kind, pitch, dur, tMax = 50, fMax = 140, shown = 1, title = 'Spectrogram', harmonics = true, t0 = 2 }) {
  card(g, w, h, title);
  const L = 74, R = w - 24, T = h * 0.17, B = h - 58;
  const X = (ms) => L + ((R - L) * ms) / tMax, Y = (f) => B - ((B - T) * f) / fMax;
  g.fillStyle = 'rgba(163,230,53,0.08)'; g.fillRect(L, Y(20), R - L, B - Y(20));
  g.font = FONT(Math.round(h * 0.052)); g.textAlign = 'right'; g.fillStyle = '#737a8e'; g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
  for (let f = 0; f <= fMax; f += 20) { g.beginPath(); g.moveTo(L, Y(f)); g.lineTo(R, Y(f)); g.stroke(); g.fillText(String(f), L - 10, Y(f) + 5); }
  g.textAlign = 'center';
  for (let t = 0; t <= tMax; t += 10) g.fillText(String(t), X(t), B + 24);
  g.fillText('time (milliseconds)', (L + R) / 2, h - 12);
  g.save(); g.translate(18, (T + B) / 2); g.rotate(-Math.PI / 2); g.fillText('kHz', 0, 0); g.restore();
  g.textAlign = 'left'; g.fillStyle = 'rgba(163,230,53,0.8)'; g.fillText('we can hear up to about 20', L + 8, Y(20) - 6);
  const N = 90;
  const trace = (mult, a, wd) => {
    g.lineCap = 'round'; g.lineWidth = wd; let started = false;
    g.beginPath();
    for (let i = 0; i <= N * shown; i++) {
      const u = i / N, f = callFreq(u, kind, pitch) * mult; if (f > fMax) { started = false; continue; }
      const x = X(t0 + u * dur), y = Y(f);
      if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y);
    }
    g.globalAlpha = a; g.stroke(); g.globalAlpha = 1;
  };
  const grad = g.createLinearGradient(X(t0), 0, X(t0 + dur), 0);
  const c0 = freqColor(callFreq(0, kind, pitch)), c1 = freqColor(callFreq(1, kind, pitch));
  grad.addColorStop(0, '#' + c0.getHexString()); grad.addColorStop(1, '#' + c1.getHexString());
  if (harmonics) { g.strokeStyle = '#8ef0ff'; trace(2, 0.28, 4); }
  g.strokeStyle = 'rgba(255,255,255,0.18)'; trace(1, 0.5, 14);
  g.strokeStyle = grad; trace(1, 1, 6);
}

// Soft glowing dot used in readouts.
export function ringOn(mat, on) { mat.opacity = on ? 1 : 0.25; }
