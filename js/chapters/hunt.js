// Chapter 4: the hunt. As a bat closes on an insect its call rate climbs from about 10 per second while searching
// to a "terminal buzz" of roughly 150 to 200 per second just before the catch. The numbers are the commonly
// published ranges; real bats vary by species and situation. The model below ramps the rate with distance.
// Rings are thinned so they stay readable, and the rate chart shows every call.
import { THREE, M, V, C, COL, makeBat, makeMoth, hud, card, FONT, hex, clamp, smooth } from '../bat.js';
import { clearHuds } from '../bat.js';

const RING = 7;            // drawn ring speed (units per second of hunt time), only for looks
const search = 2.5, buzz = 0.6;
const rate = (d) => {
  if (d >= search) return 10;
  if (d > buzz) return 10 + 40 * smooth((search - d) / (search - buzz));
  return 150 + 45 * clamp((buzz - d) / (buzz - 0.05), 0, 1);
};
const phaseOf = (d) => (d >= search ? 'Search' : d > buzz ? 'Approach' : 'Terminal buzz');
const phaseCol = { Search: '#c49bff', Approach: '#ffb547', 'Terminal buzz': '#ff7a59' };
const callMs = (d) => (d >= search ? 8 : d > buzz ? 8 - 5 * smooth((search - d) / (search - buzz)) : 0.7);

const cache = {};
function schedule(d0, v) {
  const key = d0.toFixed(2) + '|' + v.toFixed(2);
  if (cache[key]) return cache[key];
  const T = (d0 - 0.05) / v, times = []; let t = 0;
  while (t < T) { times.push(t); t += 1 / rate(d0 - v * t); }
  return (cache[key] = { T, times });
}
const countTo = (times, t) => { let lo = 0, hi = times.length; while (lo < hi) { const m = (lo + hi) >> 1; if (times[m] <= t) lo = m + 1; else hi = m; } return lo; };

export default {
  id: 'hunt',
  short: 'The hunt',
  title: 'The hunt and the buzz',
  subtitle: 'The closer the moth, the faster the calls, up to a buzz of 150 to 200 a second.',
  view: { pos: [3, 6, 10], target: [3, 3.4, 0] },
  learn: `<p>A hunting bat does not call at a steady rate. In the <b>search</b> phase it sends out roughly <b>10 calls a second</b>, long and loud. When an echo reveals an insect, the <b>approach</b> phase begins: calls get shorter and quicker as the target closes in. In the last fraction of a second, the <b>terminal buzz</b> reaches about <b>150 to 200 calls a second</b>, as commonly published, and many bats make the calls very short.</p>
    <p>Why speed up? Each call is a fresh snapshot. A fast-moving moth can dodge, so the bat needs a new fix on its position again and again. The calls also get short, so a call ends before the echo from a close target returns and they do not overlap. At 190 calls a second, calls are about 5 ms apart.</p>
    <p>You can hear this on a bat detector: slow ticks, a faster put-put-put, then a raspberry-like buzz. Donald Griffin first heard it from big brown bats over a pond in the early 1950s.</p>
    <p class="tip"><b>Try it:</b> drag the <b>hunt</b> slider to scrub through the chase, or press play. Change the moth's starting distance and the bat's speed and see how the call rate chart stretches or squeezes.</p>
    <p class="note">The distances where each phase starts vary with species and with how cluttered the place is. Here they are about 2.5 m and 0.6 m.</p>`,
  terms: [
    { t: 'Search phase', d: 'Calls at a steady, slow rate, roughly 10 a second, while the bat looks for prey.' },
    { t: 'Approach phase', d: 'Once prey is found, calls become shorter and faster.' },
    { t: 'Terminal buzz', d: 'The final burst of very short calls at roughly 150 to 200 a second just before a catch.' },
    { t: 'Call rate', d: 'How many calls a bat makes each second.' },
  ],
  defaults: { dist: 5, speed: 5, t: 0.35, play: true },
  controls: [
    { key: 't', type: 'range', label: 'The hunt', min: 0, max: 1, step: 0.002, fmt: (v) => (v * 100).toFixed(0) + '% of the way to the moth' },
    { key: 'play', type: 'toggle', label: 'Play the chase' },
    { key: 'dist', type: 'range', label: 'Moth distance at the start', min: 2, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) + ' m' },
    { key: 'speed', type: 'range', label: 'Bat speed', min: 2, max: 10, step: 0.1, fmt: (v) => v.toFixed(1) + ' m/s' },
  ],
  quiz: [
    { q: 'Roughly how fast is the terminal buzz?', options: ['10 calls a second', 'About 50 a second', 'Roughly 150 to 200 a second', 'One a second'], answer: 2, why: 'In the last moments before a catch many bats reach about 150 to 200 very short calls each second, as commonly published.' },
    { q: 'Why does a bat speed up its calls as it nears the moth?', options: ['To save energy', 'To get fresh position updates on a moving target', 'To scare the moth', 'It cannot help it'], answer: 1, why: 'Each call is a new snapshot, so faster calls let the bat track a target that is moving and close.' },
    { q: 'Which phase comes first?', options: ['Terminal buzz', 'Approach', 'Search', 'Landing'], answer: 2, why: 'Search, then approach, then the terminal buzz.' },
  ],
  reel: [
    { ms: 6000, caption: 'Searching, a bat calls about ten times a second. Then it finds a moth.', set: { dist: 5, speed: 5, play: false, t: 0 }, anim: { t: [0, 0.62] }, view: { pos: [3, 6, 10], target: [3, 3.4, 0] }, spin: 0 },
    { ms: 5600, caption: 'The calls speed up, to a terminal buzz of 150 to 200 a second just before the catch.', set: { dist: 5, speed: 5, play: false, t: 0.62 }, anim: { t: [0.62, 1] }, view: { pos: [4.6, 5, 8], target: [4.6, 3.2, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false; stage.scene.background = new THREE.Color(0x090b12); stage.setShift(0, 0);
    const root = stage.root, Y = 1.4;
    const bat = makeBat(1.0), moth = makeMoth(1.4); root.add(bat, moth);
    const floorM = new THREE.Mesh(new THREE.PlaneGeometry(26, 12), M.matte(0x10141c)); floorM.rotation.x = -Math.PI / 2; floorM.position.set(4, 0, 0); root.add(floorM);
    const rings = [];
    const geo = new THREE.RingGeometry(0.965, 1, 72).rotateX(-Math.PI / 2);
    for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); m.visible = false; root.add(m); rings.push(m); }
    const pn = hud(stage, 760, 360, (g, w, h, st, sc, t) => st && draw(g, w, h, st, sc, t), { wFrac: 0.44, top: 0.075 });
    const lab = stage.label('Moth', [0, 0.55, 0], moth, 'hot');
    let tt = 0, hold = 0, sig = '';
    const draw = (g, w, h, st, sc, tNow) => {
      card(g, w, h, 'Calls during the hunt');
      const L = 78, R = w - 26, T = h * 0.17, B = h - 58, RMAX = 200;
      const X = (t) => L + ((R - L) * t) / sc.T, Y2 = (r) => B - ((B - T) * r) / RMAX;
      // phase bands
      const tOf = (d) => (st.dist - d) / st.speed;
      const bands = [['Search', 0, Math.min(sc.T, tOf(search))], ['Approach', Math.min(sc.T, tOf(search)), Math.min(sc.T, tOf(buzz))], ['Terminal buzz', Math.min(sc.T, tOf(buzz)), sc.T]];
      g.font = FONT(21);
      bands.forEach(([n, a, b]) => { if (b <= a) return; g.fillStyle = phaseCol[n] + '26'; g.fillRect(X(a), T, X(b) - X(a), B - T); g.fillStyle = phaseCol[n]; g.textAlign = 'left'; g.fillText(n, X(a) + 8, T + 24); });
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1; g.fillStyle = '#737a8e'; g.textAlign = 'right';
      for (const r of [0, 50, 100, 150, 200]) { g.beginPath(); g.moveTo(L, Y2(r)); g.lineTo(R, Y2(r)); g.stroke(); g.fillText(String(r), L - 10, Y2(r) + 7); }
      g.save(); g.translate(18, (T + B) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('calls per second', 0, 0); g.restore();
      // rate curve
      g.strokeStyle = '#eef0f6'; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 120; i++) { const t = (sc.T * i) / 120, r = rate(st.dist - st.speed * t); i ? g.lineTo(X(t), Y2(r)) : g.moveTo(X(t), Y2(r)); }
      g.stroke();
      // ticks, one per call
      g.lineWidth = 1.2; g.strokeStyle = 'rgba(163,230,53,0.85)';
      for (const t of sc.times) { g.beginPath(); g.moveTo(X(t), B); g.lineTo(X(t), B - 26); g.stroke(); }
      g.fillStyle = '#a8aebf'; g.font = FONT(21); g.textAlign = 'center'; g.fillText(`time (the whole hunt lasts ${sc.T.toFixed(1)} s) · each green tick is one call`, (L + R) / 2, h - 14);
      g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(tNow), T); g.lineTo(X(tNow), B); g.stroke();
    };
    return {
      dispose() { clearHuds(); },
      restart() { s.t = 0; },
      update(dt, st) {
        tt += dt;
        const sc = schedule(st.dist, st.speed);
        if (st.play) {
          if (st.t >= 1) { hold += dt; if (hold > 1.2) { st.t = 0; hold = 0; } } else st.t = Math.min(1, st.t + (dt * 0.3) / sc.T);
        }
        const tNow = st.t * sc.T, dNow = st.dist - st.speed * tNow;
        const bx = st.dist - dNow;
        bat.position.set(bx, Y + Math.sin(tt * 2) * 0.04, 0); bat.rotation.z = -0.06;
        bat.flap(tt * 10, 0.5);
        moth.position.set(st.dist + 0.7, Y + Math.sin(tt * 2.6) * 0.07, 0); moth.flap(tt * 42, 0.9);
        // rings for recent calls (thinned)
        const n = countTo(sc.times, tNow), step = Math.max(1, Math.round(rate(dNow) / 14));
        let j = n - 1 - ((n - 1) % step), used = 0;
        for (; used < rings.length && j >= 0; j -= step, used++) {
          const age = tNow - sc.times[j], r = age * RING, m = rings[used];
          if (r > 3.4) break;
          m.visible = true; m.position.set(sc.times[j] * st.speed + 0.5, Y, 0); m.scale.setScalar(Math.max(0.01, r));
          const dj = st.dist - sc.times[j] * st.speed; m.material.color.set(phaseCol[phaseOf(dj)]);
          m.material.opacity = 0.35 * Math.pow(1 - r / 3.4, 1.3);
        }
        for (; used < rings.length; used++) rings[used].visible = false;
        const k = [st.dist.toFixed(1), st.speed.toFixed(1), tNow.toFixed(3)].join();
        pn.redraw(st, sc, tNow); pn.dock();
      },
      readout(st) {
        const sc = schedule(st.dist, st.speed), tNow = st.t * sc.T, d = Math.max(0.05, st.dist - st.speed * tNow), r = rate(d), ph = phaseOf(d);
        return `<div class="big" style="color:${phaseCol[ph]}">${ph}</div>
          <div class="row"><span>Moth is</span><b>${d.toFixed(2)} m away</b></div>
          <div class="row"><span>Call rate</span><b>${r.toFixed(0)} per second</b></div>
          <div class="row"><span>Time between calls</span><b>${(1000 / r).toFixed(1)} ms</b></div>
          <div class="row"><span>Each call lasts about</span><b>${callMs(d).toFixed(1)} ms</b></div>
          <div class="row"><span>Echo delay from the moth</span><b>${((2 * d) / C * 1000).toFixed(1)} ms</b></div>
          <div class="row"><span>Calls made so far</span><b>${countTo(sc.times, tNow)}</b></div>`;
      },
    };
  },
};
