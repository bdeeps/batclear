// Chapter 5: the ear and the brain. Big ears and the tragus catch the echo. Tiny differences in arrival time and
// loudness between the two ears give direction. Neurons in the auditory cortex that respond to one particular delay
// between call and echo form a map of distance (Suga and O'Neill 1979, mustached bat).
// Model numbers: ears about 2 cm apart, a level difference of up to ~12 dB (illustrative). Range resolution from
// bandwidth uses the standard sonar relation: resolution = speed of sound / (2 x bandwidth).
import { THREE, M, V, C, VS, COL, makeBat, makeMoth, Pulses, hud, card, FONT, hex, clamp } from '../bat.js';
import { clearHuds } from '../bat.js';

const EAR = 0.02, ILD_MAX = 12, CYCLE = 4.2, NN = 30, D0 = 1.5, D1 = 31.5;
const delayMs = (d) => ((2 * d) / C) * 1000;

export default {
  id: 'decode',
  short: 'Ears and brain',
  title: 'How the brain decodes it',
  subtitle: 'Two big ears give direction, and a map of delay-tuned neurons gives distance.',
  view: { pos: [-0.5, 9, 5], target: [-0.5, 2.5, 0.5] },
  learn: `<p>A bat's ears are large, and each has a flap called the <b>tragus</b>. Their folds shape the sound that reaches the ear, and the shape depends on the direction the sound came from. That helps the bat judge whether an echo is above or below it. For left and right, the bat compares its two ears.</p>
    <p>A sound from the side reaches the nearer ear a few tens of microseconds sooner and a little louder: the <b>interaural time</b> and <b>level difference</b>. With ears about 2 cm apart, the largest time difference is under 60 millionths of a second.</p>
    <p>For distance, neurons in the auditory cortex are tuned to a particular <b>delay</b> between the bat's own call and the echo. Each cell fires most for one delay. Together they form a map of range, so a spot that lights up on the map means "something is this far away". Bats can tell very small delay differences apart, in the range of microseconds in lab tests, so their ranging can be much finer than a centimetre.</p>
    <p>This is why call shape matters. The finest possible resolution is about <b>speed of sound ÷ (2 × bandwidth)</b>. A wide <b>FM</b> sweep of 50 kHz gives about 3 millimetres in theory. A narrow <b>CF</b> call gives a coarse range but is excellent at picking out speed from tiny pitch changes (chapter 3).</p>
    <p class="tip"><b>Try it:</b> move the moth around the bat's head and watch the time and level differences. Change its distance and see which neuron lights up. Then slide the bandwidth.</p>`,
  terms: [
    { t: 'Tragus', d: 'A small flap in front of the ear canal that helps the bat tell the direction of a sound.' },
    { t: 'Interaural time difference', d: 'How much sooner a sound reaches the nearer ear, up to about 60 millionths of a second here.' },
    { t: 'Interaural level difference', d: 'How much louder a sound is at the nearer ear, because the head shadows the far one.' },
    { t: 'Delay-tuned neuron', d: 'A brain cell that responds most when the echo arrives a particular time after the call.' },
    { t: 'Bandwidth', d: 'The width of the band of pitches in a call. A wider band gives finer range resolution.' },
  ],
  defaults: { az: 35, dist: 1.8, bw: 50 },
  controls: [
    { key: 'az', type: 'range', label: 'Direction of the moth', min: -80, max: 80, step: 1, fmt: (v) => (v === 0 ? 'straight ahead' : `${Math.abs(v).toFixed(0)}° ${v > 0 ? 'to one side' : 'to the other'}`) },
    { key: 'dist', type: 'range', label: 'Distance of the moth', min: 0.3, max: 5, step: 0.05, fmt: (v) => v.toFixed(2) + ' m' },
    { key: 'bw', type: 'log', label: 'Call bandwidth', min: 1, max: 80, fmt: (v) => v.toFixed(v < 10 ? 1 : 0) + ' kHz', ends: ['narrow (CF-like)', 'wide (FM sweep)'] },
    { key: 'go', type: 'buttons', label: 'Call', items: [{ label: 'Send a call now', act: (s, inst) => inst.fire() }] },
  ],
  quiz: [
    { q: 'How does a bat tell that an echo came from the left or right?', options: ['By colour', 'By tiny time and loudness differences between its two ears', 'By smell', 'By echo delay'], answer: 1, why: 'The nearer ear hears it a little sooner and a little louder.' },
    { q: 'What does a delay-tuned neuron respond to?', options: ['A particular pitch only', 'An echo arriving a particular time after the call', 'The bat’s heartbeat', 'Light'], answer: 1, why: 'Each cell prefers one call-to-echo delay, and together they map distance.' },
    { q: 'Which call gives the finest range resolution?', options: ['A narrow CF call', 'A wide FM sweep', 'Silence', 'A low hum'], answer: 1, why: 'Resolution is about the speed of sound divided by twice the bandwidth, so wider is finer.' },
  ],
  reel: [
    { ms: 6200, caption: 'Two big ears give direction. Neurons tuned to one echo delay each give distance.', set: { az: -50, dist: 4, bw: 50 }, act: (s, inst) => inst.fire(), anim: { az: [-50, 50], dist: [4, 0.9] }, view: { pos: [-0.5, 9, 5], target: [-0.5, 2.5, 0.5] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false; stage.scene.background = new THREE.Color(0x090b12); stage.setShift(0, 0);
    const root = stage.root, S = 2.2;
    const head = makeBat(S, { earSize: 1.8, wings: false }); head.position.set(-3.4, 0.4, 0); root.add(head);
    head.flap(0, 0);
    const moth = makeMoth(1.6); root.add(moth);
    const markL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), M.glow(COL.lime)), markR = markL.clone(); markR.material = M.glow(COL.lime);
    markL.position.set(-2.8, 1.1, -0.45); markR.position.set(-2.8, 1.1, 0.45); root.add(markL, markR);
    stage.label('Ear', [0, 0.3, 0], markR); stage.label('Ear', [0, 0.3, 0], markL);
    const pulses = new Pulses(root, 6, { cone: 0.9, flat: true });
    const earP = hud(stage, 720, 270, (g, w, h, st, arrived) => st && drawEar(g, w, h, st, arrived), { wFrac: 0.42, top: 0.075 }), neuP = hud(stage, 720, 300, (g, w, h, st, local) => st && drawNeu(g, w, h, st, local), { wFrac: 0.42, top: 0.37 });
    let tt = 0, cStart = 0, init = false, sig = '';
    const geom = (st) => { const a = (st.az * Math.PI) / 180, d = st.dist; return { a, p: [head.position.x + 0.6 + d * Math.cos(a), 0.4, d * Math.sin(a)], d }; };
    const spawn = (st) => {
      pulses.clear(); const G = geom(st), dir = [Math.cos(G.a), 0, Math.sin(G.a)];
      pulses.spawn({ pos: [head.position.x + 0.6, 0.4, 0], dir, t0: cStart, speed: VS, max: G.d + 0.2, color: 0xffffff, amp: 0.25 });
      pulses.spawn({ pos: G.p, dir: null, t0: cStart + G.d / VS, speed: VS, max: G.d, color: COL.amber, amp: 0.7 });
    };
    const itd = (st) => (EAR * Math.sin((st.az * Math.PI) / 180) / C) * 1e6;
    const ild = (st) => ILD_MAX * Math.sin((st.az * Math.PI) / 180);
    const drawEar = (g, w, h, st, arrived) => {
      card(g, w, h, 'What each ear receives (tiny time and level gaps)');
      const T = itd(st), I = ild(st), tw = 300; // µs shown
      const L = 120, R = w - 30;
      const X = (us) => L + ((R - L) * (us + 60)) / tw;
      const lane = (y, offUs, gain, name, col) => {
        g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke();
        g.fillStyle = col; g.font = FONT(24, 500); g.textAlign = 'left'; g.fillText(name, 24, y + 8);
        if (!arrived) return;
        g.strokeStyle = col; g.lineWidth = 3; g.beginPath();
        for (let x = L; x <= R; x += 2) { const us = ((x - L) / (R - L)) * tw - 60, k = us - offUs, env = Math.exp(-((k / 55) ** 2)); const yy = y - 38 * gain * env * Math.cos(k * 0.45); x === L ? g.moveTo(x, yy) : g.lineTo(x, yy); }
        g.stroke();
      };
      const nearGain = Math.pow(10, Math.abs(I) / 40), farGain = Math.pow(10, -Math.abs(I) / 40);
      const nearLeft = I < 0;
      lane(h * 0.45, nearLeft ? -Math.abs(T) / 2 : Math.abs(T) / 2, nearLeft ? nearGain : farGain, 'A', '#a3e635');
      lane(h * 0.75, nearLeft ? Math.abs(T) / 2 : -Math.abs(T) / 2, nearLeft ? farGain : nearGain, 'B', '#8ef0ff');
      g.font = FONT(20); g.fillStyle = '#737a8e'; g.textAlign = 'center';
      g.fillText(`time difference ${Math.abs(T).toFixed(0)} millionths of a second · level difference ${Math.abs(I).toFixed(0)} dB`, w / 2, h - 12);
    };
    const drawNeu = (g, w, h, st, local) => {
      card(g, w, h, 'Delay-tuned neurons: which one fires?');
      const dly = delayMs(st.dist), arrive = st.dist * 2 / VS, age = local - arrive;
      const L = 40, R = w - 40, y = h * 0.5, sp = (R - L) / (NN - 1);
      for (let i = 0; i < NN; i++) {
        const best = D0 + (i * (D1 - D0)) / (NN - 1), act = Math.exp(-(((dly - best) / 1.1) ** 2)) * (age > 0 ? Math.max(0, 1 - age / 1.6) : 0);
        g.fillStyle = `rgba(255,255,255,${0.1 + 0.05})`; g.beginPath(); g.arc(L + i * sp, y, 12, 0, 7); g.fill();
        if (act > 0.02) { g.fillStyle = `rgba(255,181,71,${act})`; g.shadowColor = '#ffb547'; g.shadowBlur = 26 * act; g.beginPath(); g.arc(L + i * sp, y, 12 + 8 * act, 0, 7); g.fill(); g.shadowBlur = 0; }
      }
      g.fillStyle = '#737a8e'; g.font = FONT(22); g.textAlign = 'left'; g.fillText(`${D0} ms (${(C * D0 / 2000).toFixed(2)} m)`, L - 10, y + 50);
      g.textAlign = 'right'; g.fillText(`${D1} ms (${(C * D1 / 2000).toFixed(1)} m)`, R + 10, y + 50);
      g.textAlign = 'center'; g.fillStyle = '#a8aebf'; g.fillText('short delay: near  →  long delay: far', w / 2, h - 16);
    };
    return {
      dispose() { clearHuds(); },
      fire() { cStart = tt; spawn(s); },
      update(dt, st) {
        tt += dt;
        if (!init) { init = true; spawn(st); }
        let local = tt - cStart;
        if (local > CYCLE) { cStart += CYCLE * Math.floor(local / CYCLE); local = tt - cStart; spawn(st); }
        const k = [st.az, st.dist.toFixed(2)].join(); if (k !== sig) { sig = k; spawn(st); }
        const G = geom(st); moth.position.set(G.p[0], 0.4 + Math.sin(tt * 3) * 0.05, G.p[2]); moth.rotation.y = Math.PI - G.a; moth.flap(tt * 40, 0.9);
        const arrive = (2 * G.d) / VS, arrived = local >= arrive;
        const gain = Math.pow(10, ild(st) / 40), a = arrived ? Math.max(0, 1 - (local - arrive) / 1.2) : 0;
        markR.material.color.setRGB(0.2 + 0.8 * a * gain / 1.4, 0.9 * (0.3 + a), 0.2); markL.material.color.setRGB(0.2 + 0.8 * a / gain / 1.4, 0.9 * (0.3 + a), 0.2);
        pulses.update(tt);
        earP.redraw(st, arrived); neuP.redraw(st, local); earP.dock(); neuP.dock();
      },
      readout(st) {
        const d = delayMs(st.dist), nb = Math.round(((d - D0) / (D1 - D0)) * (NN - 1)), res = (C / (2 * st.bw * 1000)) * 1000;
        return `<div class="big">Direction and distance</div>
          <div class="row"><span>Time gap between ears</span><b>${Math.abs(itd(st)).toFixed(0)} µs</b></div>
          <div class="row"><span>Level gap (model)</span><b>${Math.abs(ild(st)).toFixed(0)} dB</b></div>
          <div class="row"><span>Echo delay</span><b>${d.toFixed(1)} ms</b></div>
          <div class="row"><span>Neuron that fires</span><b>#${clamp(nb + 1, 1, NN)} of ${NN}</b></div>
          <div class="row"><span>Best range resolution at ${st.bw.toFixed(st.bw < 10 ? 1 : 0)} kHz</span><b>${res < 10 ? res.toFixed(1) + ' mm' : (res / 10).toFixed(1) + ' cm'}</b></div>
          <p class="r-say">${st.bw >= 20 ? 'Wide band: a sharp range picture, as with FM sweeps.' : 'Narrow band: coarse range, but excellent for reading speed.'}</p>`;
      },
    };
  },
};
