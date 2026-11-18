// Chapter 1: the call. A bat shouts a very short, very loud pulse of ultrasound and we draw it as a spectrogram.
// Real calls vary a lot by species (roughly 11 to 200+ kHz, a fraction of a millisecond to tens of ms).
// Shells below are drawn in slow motion, and colour follows pitch, so a sweep shows as a colour change.
import { THREE, M, V, C, VS, COL, makeBat, Pulses, hud, drawSpec, callFreq, freqColor, clamp } from '../bat.js';
import { clearHuds } from '../bat.js';

const KINDS = {
  fm: { n: 'FM sweep', say: 'A downward chirp through a wide band of pitches, often about an octave.' },
  qcf: { n: 'Shallow sweep', say: 'A gentle slide, common in bats that fly high in open air and want long reach.' },
  cf: { n: 'Constant (CF)', say: 'One steady pitch held for tens of ms, with a quick sweep at each end. Horseshoe bats call like this.' },
};
const CYCLE = 3.2, N = 8;

export default {
  id: 'call',
  short: 'The call',
  title: 'A shout above hearing',
  subtitle: 'A pulse of ultrasound a few thousandths of a second long, drawn as a picture.',
  view: { pos: [0.6, 2.8, 11], target: [0.6, 2.3, 0] },
  learn: `<p>A bat <b>echolocates</b> by making a sound and listening to what comes back. The call is <b>ultrasound</b>, mostly somewhere between about 20 and 120 kilohertz depending on the species. People hear up to roughly 20 kHz, so we miss almost all of it.</p>
    <p>It is made in the <b>larynx</b>, and sent out through the open mouth, or, in horseshoe bats, through the nostrils and a folded <b>nose leaf</b> that shapes the beam. Each call is a short <b>pulse</b>, a few milliseconds in many species, and some species are very loud: roughly 100 to 140 decibels at 10 centimetres, but too high for us to hear. Others whisper.</p>
    <p>A <b>spectrogram</b> plots pitch against time. A <b>frequency-modulated (FM)</b> call sweeps down through many pitches. A <b>constant-frequency (CF)</b> call holds one. The shape matters, because each is good at a different job. Chapter 4 explains how.</p>
    <p class="tip"><b>Try it:</b> switch between FM and CF, then slide the <b>pitch</b> and the <b>duration</b>. Watch the shells in space: their colour follows pitch, and a longer call is a longer burst of sound.</p>
    <p class="note">Sound is drawn about 40 times slower than real. Real calls differ widely between species and situations, so these numbers are typical, not exact.</p>`,
  terms: [
    { t: 'Ultrasound', d: 'Sound above about 20 kilohertz, higher than people can hear.' },
    { t: 'Pulse', d: 'One short call. Bats send pulses, then listen in the silence between them.' },
    { t: 'Spectrogram', d: 'A picture of sound with time across and pitch up. Brighter means louder.' },
    { t: 'FM and CF', d: 'Frequency-modulated calls sweep through pitches. Constant-frequency calls hold one pitch.' },
    { t: 'Wavelength', d: 'The distance between wave crests: the speed of sound divided by the frequency, about 7 millimetres at 50 kHz.' },
  ],
  defaults: { kind: 'fm', pitch: 45, dur: 6 },
  controls: [
    { key: 'kind', type: 'seg', label: 'Kind of call', options: Object.entries(KINDS).map(([v, k]) => ({ v, label: k.n })) },
    { key: 'pitch', type: 'log', label: 'Pitch (middle of the call)', min: 15, max: 130, fmt: (v) => v.toFixed(0) + ' kHz', ends: ['lower', 'higher'] },
    { key: 'dur', type: 'log', label: 'Duration', min: 1, max: 40, fmt: (v) => v.toFixed(v < 10 ? 1 : 0) + ' ms', ends: ['shorter', 'longer'] },
    { key: 'go', type: 'buttons', label: 'Hear it again', items: [{ label: 'Send a call now', act: (s, inst) => inst.fire() }] },
  ],
  quiz: [
    { q: 'Why can we not hear most bat calls?', options: ['They are far too quiet', 'They are mostly above the pitch people can hear', 'Bats whisper', 'The air absorbs them'], answer: 1, why: 'Most are between about 20 and 120 kHz. People hear up to roughly 20 kHz, so we miss nearly all of it, even when the calls are very loud.' },
    { q: 'What does a spectrogram plot?', options: ['Distance against time', 'Pitch against time', 'Loudness against distance', 'Speed against pitch'], answer: 1, why: 'Time runs across and pitch goes up. A downward sweep shows as a line sloping down.' },
    { q: 'What is the main difference between an FM and a CF call?', options: ['FM is louder', 'FM sweeps through pitches, CF holds one', 'CF is only for baby bats', 'There is none'], answer: 1, why: 'FM covers a wide band of pitches in a short time. CF holds a steady pitch, which suits a different job.' },
  ],
  reel: [
    { ms: 5200, caption: 'A bat shouts a chirp too high for us to hear, over in a few thousandths of a second.', set: { kind: 'fm', pitch: 45, dur: 6 }, act: (s, inst) => inst.fire(), view: { pos: [0.6, 2.8, 11], target: [0.6, 2.3, 0] }, spin: 0 },
    { ms: 5200, caption: 'Horseshoe bats hold one steady note instead, and send it out through the nose.', set: { kind: 'cf', pitch: 80, dur: 30 }, act: (s, inst) => inst.fire(), view: { pos: [0.6, 2.8, 11], target: [0.6, 2.3, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false; stage.scene.background = new THREE.Color(0x090b12); stage.setShift(0, 0);
    const root = stage.root;
    const bat = makeBat(1.9); bat.position.set(-3.8, 0.3, 0); root.add(bat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 40), M.glow(COL.lime)); ring.position.set(-3.0, 0.3, 0); ring.rotation.y = Math.PI / 2; root.add(ring); ring.visible = false;
    const pulses = new Pulses(root, N + 2);
    const pn = hud(stage, 720, 380, (g, w, h) => drawSpec(g, w, h, { kind: 'fm', pitch: 45, dur: 6 }), { wFrac: 0.42, top: 0.075 });
    stage.label('The call leaves the mouth', [-3.2, 1.2, 0]);
    let tt = 0, cStart = 0, cyc = -1, drawn = '';
    const tEmit = (st) => st.dur * 0.02;       // slow-motion length of the burst
    const spawn = (st) => {
      pulses.clear();
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1), f = callFreq(u, st.kind, st.pitch);
        pulses.spawn({ pos: [-3.3, 0.3, 0], dir: [1, 0, 0], t0: cStart + u * tEmit(st), speed: VS, max: 8, color: freqColor(f), amp: 0.5 });
      }
    };
    return {
      dispose() { clearHuds(); },
      fire() { cStart = tt; cyc = 0; spawn(s); },
      update(dt, st) {
        tt += dt;
        let local = tt - cStart;
        if (local > CYCLE) { cStart += CYCLE * Math.floor(local / CYCLE); local = tt - cStart; spawn(st); }
        if (cyc < 0) { cyc = 0; spawn(st); }
        const te = Math.max(0.12, tEmit(st));
        const shown = clamp(local / te, 0, 1);
        const key = [st.kind, st.pitch.toFixed(1), st.dur.toFixed(1), shown.toFixed(2)].join('|');
        if (key !== drawn) { drawn = key; pn.redraw({ kind: st.kind, pitch: st.pitch, dur: st.dur, shown }); }
        // refresh pulses if the call changed mid-flight
        if (this._k !== st.kind + st.pitch.toFixed(0) + st.dur.toFixed(0)) { this._k = st.kind + st.pitch.toFixed(0) + st.dur.toFixed(0); spawn(st); }
        pulses.update(tt);
        bat.flap(tt * 9, 0.5);
        bat.position.y = 0.3 + Math.sin(tt * 2) * 0.06;
        const open = local < te + 0.1;
        bat.mouth.scale.setScalar(open ? 1.8 + Math.sin(tt * 30) * 0.2 : 1);
        ring.visible = open; ring.material.color.copy(freqColor(callFreq(shown, st.kind, st.pitch)));
        pn.dock();
      },
      readout(st) {
        const k = KINDS[st.kind], f0 = callFreq(0, st.kind, st.pitch), f1 = callFreq(1, st.kind, st.pitch);
        const lam = C / (st.pitch * 1000) * 1000;
        const len = (C * st.dur) / 1000;
        return `<div class="big">${k.n}</div><p class="r-say">${k.say}</p>
          <div class="row"><span>Sweeps from</span><b>${f0.toFixed(0)} to ${f1.toFixed(0)} kHz</b></div>
          <div class="row"><span>Duration</span><b>${st.dur.toFixed(1)} ms</b></div>
          <div class="row"><span>The burst is</span><b>${len.toFixed(2)} m long in air</b></div>
          <div class="row"><span>Wavelength at ${st.pitch.toFixed(0)} kHz</span><b>${lam.toFixed(1)} mm</b></div>
          <div class="row"><span>Can we hear it?</span><b>${st.pitch >= 20 ? 'No, above our hearing' : 'Just barely'}</b></div>
          <div class="row"><span>How loud?</span><b>Very loud in many species</b></div>`;
      },
    };
  },
};
