// Chapter 3: speed from pitch. A bat flying toward a target hears the echo at a higher pitch (Doppler shift).
// Horseshoe bats lower the pitch of their call by about the amount their own flight will raise the echo, so the
// echo lands on the pitch their ears are most sensitive to (Doppler shift compensation, Schnitzler 1968).
// The resting frequency below (83 kHz) is typical of the greater horseshoe bat in Europe; it varies by species and bat.
// Drawn speeds are exaggerated so the effect is visible; the numbers in the readout are the real physics.
import { THREE, M, V, C, COL, makeBat, makeMoth, Pulses, hud, card, FONT, hex, clamp, freqColor } from '../bat.js';
import { clearHuds } from '../bat.js';

const REF = 83;           // kHz, resting frequency
const VIS = 0.14, CV = 3.5, LOOP = 3.6, GAP = 0.22;
const lo = 74, hi = 92;

// emitted frequency and echo frequency (kHz). vb: bat speed toward the moth, vm: moth speed away from the bat (m/s).
const emitted = (s) => (s.dsc ? REF * (C - s.speed) / (C + s.speed) : REF);
const echoF = (s) => emitted(s) * ((C - s.away) * (C + s.speed)) / ((C - s.speed) * (C + s.away));

export default {
  id: 'doppler',
  short: 'Speed from pitch',
  title: 'Doppler: reading speed',
  subtitle: 'A horseshoe bat turns its own call down so the echo comes back on its best pitch.',
  view: { pos: [-0.3, 7.5, 10], target: [-0.3, 3.4, 0] },
  learn: `<p>When a bat flies toward a target, it crowds the sound waves together in front of it, and the echo comes back at a <b>higher pitch</b>. This is the <b>Doppler shift</b>. It is about <b>2 × frequency × speed ÷ the speed of sound</b>: for a bat at 83 kHz, each metre per second of closing speed adds close to half a kilohertz.</p>
    <p>Horseshoe bats send out a long <b>constant-frequency</b> call and listen for tiny changes in it. They have a very narrow band of extra-sharp hearing, an <b>auditory fovea</b>, tuned near their own resting pitch. So as they speed up, they lower the pitch of each call by about the amount the Doppler shift will add. The echo from a still object then lands right on the fovea. This is <b>Doppler shift compensation</b>.</p>
    <p>Whatever shift is left over must come from the target moving, such as a fluttering moth wing. That is how a horseshoe bat picks a flying insect out of leaves.</p>
    <p class="tip"><b>Try it:</b> raise the bat's speed with compensation off, then on. Then let the moth fly away: the leftover shift in the echo is the moth's own motion.</p>
    <p class="note">The wave drawing exaggerates the bat's speed. The readout uses real numbers. The 83 kHz resting pitch is typical for the greater horseshoe bat and differs between species and animals.</p>`,
  terms: [
    { t: 'Doppler shift', d: 'The change in pitch caused by movement toward or away from the sound.' },
    { t: 'Compensation', d: 'The bat lowers its call pitch by about the amount its own speed will raise the echo.' },
    { t: 'Auditory fovea', d: 'A narrow band of especially sharp hearing, tuned to the pitch the bat wants its echoes to have.' },
    { t: 'Flutter', d: 'Wing-beat changes in an insect that make the echo wobble in pitch and loudness.' },
  ],
  defaults: { speed: 6, away: 0, dsc: true },
  controls: [
    { key: 'speed', type: 'range', label: 'Bat speed', min: 0, max: 12, step: 0.1, fmt: (v) => v.toFixed(1) + ' m/s' },
    { key: 'away', type: 'range', label: 'Moth flying away at', min: 0, max: 5, step: 0.1, fmt: (v) => v.toFixed(1) + ' m/s' },
    { key: 'dsc', type: 'toggle', label: 'Doppler shift compensation', hint: 'On: the bat lowers its call to cancel the shift from its own speed.' },
  ],
  quiz: [
    { q: 'What happens to the pitch of the echo when a bat flies toward a still target?', options: ['It goes up', 'It goes down', 'It stays the same', 'It disappears'], answer: 0, why: 'The bat squeezes the waves together in front of it, so the returning echo has a higher pitch.' },
    { q: 'What does Doppler shift compensation do?', options: ['Makes calls louder', 'Lowers the call so the echo returns on the best-hearing pitch', 'Slows the bat down', 'Switches to FM'], answer: 1, why: 'By lowering the call by about the shift its own speed will add, the bat keeps echoes inside its narrow auditory fovea.' },
    { q: 'With compensation on, an echo comes back higher than the resting pitch. What does that suggest?', options: ['The target is moving toward the bat', 'The target is quiet', 'The bat is deaf', 'Nothing'], answer: 0, why: 'A still target would return the resting pitch. Extra shift means the target is closing in, or its wings are fluttering.' },
  ],
  reel: [
    { ms: 5600, caption: 'Flying toward a target squeezes the echo up in pitch. Horseshoe bats cancel that by lowering their call.', set: { speed: 1, away: 0, dsc: false }, anim: { speed: [1, 10] }, view: { pos: [-0.3, 7.5, 10], target: [-0.3, 3.4, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false; stage.scene.background = new THREE.Color(0x090b12); stage.setShift(0, 0);
    const root = stage.root, Y = 1.4;
    const bat = makeBat(1.3, { noseleaf: true }); root.add(bat);
    const moth = makeMoth(1.6); root.add(moth);
    const pulses = new Pulses(root, 44, { flat: true });
    const pn = hud(stage, 720, 350, (g, w, h, st) => st && draw(g, w, h, st), { wFrac: 0.42, top: 0.075 });
    stage.label('Doppler-shift compensation', [0, 0.9, 0], bat, 'hot');
    const hist = []; let tt = 0, nextRing = 0, acc = 0;
    const draw = (g, w, h, st) => {
      card(g, w, h, 'Pitch of the call and its echo (kHz)');
      const L = 70, R = w - 24, T = h * 0.18, B = h - 56;
      const Y2 = (f) => B - ((B - T) * (f - lo)) / (hi - lo);
      g.fillStyle = 'rgba(163,230,53,0.16)'; g.fillRect(L, Y2(REF + 0.5), R - L, Y2(REF - 0.5) - Y2(REF + 0.5));
      g.font = FONT(22); g.fillStyle = '#a3e635'; g.textAlign = 'left'; g.fillText('auditory fovea (resting pitch)', L + 8, Y2(REF + 0.5) - 6);
      g.fillStyle = '#737a8e'; g.textAlign = 'right'; g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
      for (let f = lo + 2; f <= hi; f += 4) { g.beginPath(); g.moveTo(L, Y2(f)); g.lineTo(R, Y2(f)); g.stroke(); g.fillText(String(f), L - 10, Y2(f) + 7); }
      const X = (t) => R - ((R - L) * (tt - t)) / 8;
      const line = (key, color) => { g.strokeStyle = color; g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath(); hist.forEach((p, i) => { const x = X(p.t), y = Y2(clamp(p[key], lo, hi)); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
      line('e', '#ffb547'); line('r', '#8ef0ff');
      const last = hist[hist.length - 1] || { e: REF, r: REF };
      g.textAlign = 'left'; g.font = FONT(26, 500);
      g.fillStyle = '#ffb547'; g.fillText(`call ${last.e.toFixed(2)}`, L + 10, B - 40);
      g.fillStyle = '#8ef0ff'; g.fillText(`echo ${last.r.toFixed(2)}`, L + 10, B - 10);
      g.fillStyle = '#737a8e'; g.font = FONT(20); g.textAlign = 'right'; g.fillText('last 8 seconds', R, B + 4);
    };
    return {
      dispose() { clearHuds(); },
      update(dt, st) {
        tt += dt; acc += dt;
        const e = emitted(st), r = echoF(st);
        while (acc >= 1 / 30) { acc -= 1 / 30; hist.push({ t: tt, e, r }); }
        while (hist.length && tt - hist[0].t > 8) hist.shift();
        const ph = tt % LOOP, bx = -4.4 + st.speed * VIS * ph, mx = 3.4 + st.away * VIS * ph;
        bat.position.set(bx, Y, 0); moth.position.set(mx, Y + Math.sin(tt * 2.5) * 0.06, 0);
        bat.flap(tt * 11, 0.45); moth.flap(tt * 45, 0.9);
        if (tt >= nextRing) { nextRing = tt + GAP; pulses.spawn({ pos: [bx + 0.5, Y, 0], dir: null, t0: tt, speed: CV, max: 8, color: freqColor(e - 18 + 10), amp: 0.3 }); }
        pulses.update(tt);
        pn.redraw(st); pn.dock();
      },
      readout(st) {
        const e = emitted(st), r = echoF(st), d = r - REF, v = (d * C) / (2 * REF);
        const note = st.dsc ? (Math.abs(d) < 0.05 ? 'The echo lands on the best-hearing pitch.' : 'Compensation cancels the bat’s own speed. What is left is the moth’s motion.') : 'No compensation: the echo comes back too high for the fovea.';
        return `<div class="big">${note}</div>
          <div class="row"><span>Call</span><b>${e.toFixed(2)} kHz</b></div>
          <div class="row"><span>Echo</span><b>${r.toFixed(2)} kHz</b></div>
          <div class="row"><span>Resting pitch</span><b>${REF.toFixed(2)} kHz</b></div>
          <div class="row"><span>Echo off the resting pitch by</span><b>${d >= 0 ? '+' : ''}${d.toFixed(2)} kHz</b></div>
          ${st.dsc ? `<div class="row"><span>Moth speed read from that</span><b>${(-v).toFixed(1)} m/s away</b></div>` : ''}`;
      },
    };
  },
};
