// Chapter 2: echoes become a picture. The delay between a call and an echo gives the distance:
// range = speed of sound x delay / 2, with 343 m/s in air at about 20 C (1 ms is about 17 cm).
// Sound is drawn about 40 times slower than real so you can watch it go out and come back.
import { THREE, M, V, C, VS, COL, makeBat, makeMoth, Pulses, hud, card, FONT, hex, clamp } from '../bat.js';
import { clearHuds } from '../bat.js';

const CYCLE = 4.2, MAXMS = 60;
const OBJ = {
  moth: { n: 'Moth', ang: 0, col: COL.amber, str: 0.3 },
  tree: { n: 'Tree', ang: -0.5, col: COL.lime, str: 0.5 },
  wall: { n: 'Wall', ang: 0.42, col: COL.cyan, str: 0.7 },
};
const delayMs = (d) => (2 * d / C) * 1000;

export default {
  id: 'echo',
  short: 'Echoes make a picture',
  title: 'From echo to distance',
  subtitle: 'The wait before an echo returns tells the bat how far away something is.',
  view: { pos: [4.4, 10, 14], target: [4.4, 3.7, -0.5] },
  learn: `<p>Sound travels at about <b>343 metres per second</b> in air. A bat sends out a call, and the call hits a moth, a tree and a wall. Each sends back a faint <b>echo</b>, and each echo returns after a different <b>delay</b>.</p>
    <p>The sound has to go out and come back, so the distance is half the trip: <b>range = speed of sound × delay ÷ 2</b>. An echo that returns after 1 millisecond comes from about <b>17 centimetres</b> away. After 10 milliseconds it is about 1.7 metres. The bat's brain turns each delay into a distance, and with the direction of each echo, builds a map of the scene.</p>
    <p>A big flat wall gives a strong echo. A small moth gives a weak one, and the echo gets much fainter with distance because the sound spreads out on the way there and again on the way back. That is why echolocation works over a few metres, not a few hundred.</p>
    <p class="tip"><b>Try it:</b> drag the three distances and watch the echoes on the chart. Each blip lands at its own delay. Move the moth closer and its blip slides toward the left.</p>
    <p class="note">The sound is drawn about 40 times slower than real. The speed of sound changes a little with air temperature.</p>`,
  terms: [
    { t: 'Echo delay', d: 'The time between the call leaving the bat and its echo coming back.' },
    { t: 'Range', d: 'The distance to a target. Range equals the speed of sound times the delay, divided by two.' },
    { t: 'Speed of sound', d: 'About 343 metres per second in air at 20 degrees Celsius.' },
    { t: 'Echogram', d: 'A strip that shows the call at zero and each echo at its delay.' },
  ],
  defaults: { moth: 2.5, tree: 5, wall: 7.5 },
  controls: [
    { key: 'moth', type: 'range', label: 'Moth distance', min: 0.4, max: 6, step: 0.05, fmt: (v) => v.toFixed(2) + ' m' },
    { key: 'tree', type: 'range', label: 'Tree distance', min: 1, max: 8, step: 0.05, fmt: (v) => v.toFixed(2) + ' m' },
    { key: 'wall', type: 'range', label: 'Wall distance', min: 2, max: 9, step: 0.05, fmt: (v) => v.toFixed(2) + ' m' },
    { key: 'go', type: 'buttons', label: 'Call', items: [{ label: 'Send a call now', act: (s, inst) => inst.fire() }] },
  ],
  quiz: [
    { q: 'An echo comes back 10 milliseconds after the call. About how far away is the target?', options: ['17 cm', '1.7 m', '17 m', '3.4 m'], answer: 1, why: '343 m/s × 0.010 s ÷ 2 is about 1.7 metres. The division by two is because the sound travels out and back.' },
    { q: 'Why do we divide by two?', options: ['Bats hear with two ears', 'The sound makes a round trip', 'Echoes are half as fast', 'Air slows sound by half'], answer: 1, why: 'The delay covers the trip out and the trip back, so the target is half that distance away.' },
    { q: 'What happens to the echo from a moth that moves closer?', options: ['It returns sooner', 'It returns later', 'It stops', 'It gets higher in pitch for no reason'], answer: 0, why: 'Less distance means a shorter round trip, so a shorter delay.' },
  ],
  reel: [
    { ms: 5600, caption: 'The call hits a moth, a tree and a wall, and each sends back an echo.', set: { moth: 2.5, tree: 5, wall: 7.5 }, act: (s, inst) => inst.fire(), view: { pos: [4.4, 10, 14], target: [4.4, 3.7, -0.5] }, spin: 0 },
    { ms: 5200, caption: 'Echo delay becomes distance. One millisecond is about 17 centimetres.', set: { moth: 4, tree: 5, wall: 7.5 }, act: (s, inst) => inst.fire(), anim: { moth: [4, 1] }, view: { pos: [4.4, 10, 14], target: [4.4, 3.7, -0.5] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false; stage.scene.background = new THREE.Color(0x090b12); stage.setShift(0, 0);
    const root = stage.root, Y = 1.5;
    const floorM = new THREE.Mesh(new THREE.PlaneGeometry(26, 14), M.matte(0x10141c)); floorM.rotation.x = -Math.PI / 2; floorM.position.set(5, 0, 0); floorM.receiveShadow = true; root.add(floorM);
    const bat = makeBat(0.9); bat.position.set(0, Y, 0); root.add(bat);
    const moth = makeMoth(1.1); root.add(moth);
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.4, 10), M.matte(COL.bark)); trunk.position.y = 1.2;
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 12), M.matte(COL.leaf)); c1.position.y = 3;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.7, 12), M.matte(COL.leaf)); c2.position.y = 4.1;
    tree.add(trunk, c1, c2); root.add(tree);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 5), M.matte(COL.stone)); root.add(wall);
    const labels = { moth: stage.label('Moth', [0, 0.6, 0], moth, 'hot'), tree: stage.label('Tree', [0, 5, 0], tree), wall: stage.label('Wall', [0, 2.1, 0], wall) };
    const pulses = new Pulses(root, 10, { cone: 0.95 });
    const pn = hud(stage, 720, 340, (g, w, h, l, st) => st && draw(g, w, h, l, st), { wFrac: 0.42, top: 0.075 });
    let tt = 0, cStart = 0, init = false, sig = '';
    const pos = (k, st) => { const o = OBJ[k], d = st[k]; return [d * Math.cos(o.ang), Y, d * Math.sin(o.ang)]; };
    const spawn = (st) => {
      pulses.clear();
      pulses.spawn({ pos: [0.45, Y, 0], dir: [1, 0, 0], t0: cStart, speed: VS, max: 11, color: 0xffffff, amp: 0.3 });
      for (const k of Object.keys(OBJ)) {
        const d = st[k], o = OBJ[k], p = pos(k, st);
        pulses.spawn({ pos: p, dir: null, t0: cStart + d / VS, speed: VS, max: d * 1.02, color: o.col, amp: o.str });
      }
    };
    const draw = (g, w, h, local, st) => {
      card(g, w, h, 'Echogram: when each echo arrives');
      const L = 50, R = w - 30, B = h - 78, T = h * 0.2;
      const X = (ms) => L + ((R - L) * ms) / MAXMS;
      g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(L, B); g.lineTo(R, B); g.stroke();
      g.font = FONT(22); g.fillStyle = '#737a8e'; g.textAlign = 'center';
      for (let t = 0; t <= MAXMS; t += 10) { g.fillText(t + ' ms', X(t), B + 28); g.beginPath(); g.moveTo(X(t), B); g.lineTo(X(t), B + 8); g.stroke(); }
      g.fillText('time after the call', (L + R) / 2, h - 12);
      const now = local * SLOWMS;
      g.fillStyle = '#ffffff'; g.fillRect(X(0) - 4, B - (B - T) * 0.95, 8, (B - T) * 0.95);
      g.textAlign = 'left'; g.fillStyle = '#eef0f6'; g.fillText('call', X(0) + 10, T + 20);
      for (const k of Object.keys(OBJ)) {
        const d = st[k], ms = delayMs(d), o = OBJ[k];
        if (now < ms) continue;
        const hgt = (B - T) * o.str * 1.2 * Math.min(1, 1.2 / Math.sqrt(Math.max(d, 0.6) / 2));
        g.fillStyle = hex(o.col); g.fillRect(X(ms) - 6, B - hgt, 12, hgt);
        g.font = FONT(24, 500); g.textAlign = 'center';
        g.fillText(`${o.n} ${ms.toFixed(1)} ms`, clamp(X(ms), 90, w - 110), B - hgt - 32);
        g.font = FONT(22); g.fillStyle = '#a8aebf'; g.fillText(`= ${d.toFixed(2)} m`, clamp(X(ms), 90, w - 110), B - hgt - 8);
      }
      if (now < MAXMS) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(X(now), B); g.lineTo(X(now), T); g.stroke(); g.setLineDash([]); }
    };
    return {
      dispose() { clearHuds(); },
      fire() { cStart = tt; spawn(s); },
      update(dt, st) {
        tt += dt;
        if (!init) { init = true; spawn(st); }
        let local = tt - cStart;
        if (local > CYCLE) { cStart += CYCLE * Math.floor(local / CYCLE); local = tt - cStart; spawn(st); }
        const k = Object.keys(OBJ).map((q) => st[q].toFixed(2)).join();
        if (k !== sig) { sig = k; spawn(st); }
        // place objects
        const pm = pos('moth', st); moth.position.set(pm[0], pm[1] + Math.sin(tt * 3) * 0.08, pm[2]); moth.flap(tt * 40, 0.9);
        const pt = pos('tree', st); tree.position.set(pt[0], 0, pt[2]);
        const pw = pos('wall', st); wall.position.set(pw[0], 1.8, pw[2]); wall.rotation.y = -OBJ.wall.ang;
        bat.flap(tt * 9, 0.5); bat.position.y = Y + Math.sin(tt * 2) * 0.05;
        pulses.update(tt);
        pn.redraw(local, st); pn.dock();
      },
      readout(st) {
        const row = (k) => `<div class="row"><span>${OBJ[k].n} is ${st[k].toFixed(2)} m away</span><b>echo in ${delayMs(st[k]).toFixed(1)} ms</b></div>`;
        return `<div class="big">Delay becomes distance</div><p class="r-say">distance = 343 m/s × delay ÷ 2. So 1 ms is about 17 cm.</p>${row('moth')}${row('tree')}${row('wall')}`;
      },
    };
  },
};
const SLOWMS = 1000 / 40 * 1; // ms of real time that pass per second of drawn time: 1000 ms / 40
