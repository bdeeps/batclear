// Chapter 6: the arms race. Moths hear bat calls, and a moth hears a bat from farther away than the bat hears the
// moth, because the call only goes one way while the echo must go out and back. Tiger moths click back and can jam
// the bat's ranging. Some bats whisper. The numbers below are a toy model with round constants, not measurements:
// call level at 10 cm (dB), spreading loss 20 log10(d/0.1), air absorption 1.5 dB/m (about 40-50 kHz, varies with
// humidity), moth ear threshold 45 dB SPL (published thresholds run from about 20 to 60), bat threshold 10 dB SPL
// (published 2 to 20), and an echo offset of -17 dB chosen so a normal bat finds a moth at about 5 m.
// Bats are not blind: most species see as well, and eyes help over longer distances.
import { THREE, M, V, C, COL, makeBat, makeMoth, Pulses, clamp, lerp } from '../bat.js';
import { clearHuds } from '../bat.js';

const F = 0.4;                       // scene units per metre
const THR_MOTH = 45, THR_BAT = 10, ABS = 1.5, K = -17, VB = 6, SIM = 0.6;
const callAt = (L0, d) => L0 - 20 * Math.log10(Math.max(d, 0.05) / 0.1) - ABS * d;
const echoAt = (L0, d) => L0 - 40 * Math.log10(Math.max(d, 0.05) / 0.1) - 2 * ABS * d + K;
function range(fn, thr) { let r = 0; for (let d = 0.1; d < 80; d += 0.05) { if (fn(d) >= thr) r = d; else if (r) break; } return r; }
const TYPES = {
  eared: { n: 'Eared moth', say: 'Hears the bat early and dives.' },
  tiger: { n: 'Tiger moth', say: 'Hears the bat and clicks back to jam it.' },
  deaf: { n: 'Deaf moth', say: 'Cannot hear the bat, so it keeps flying.' },
};

export default {
  id: 'arms',
  short: 'The arms race',
  title: 'Moths, whispers and more',
  subtitle: 'Moths that hear, tiger moths that jam, bats that whisper, and others that use sonar too.',
  view: { pos: [-2.5, 8, 13], target: [-2.5, 4.4, 0] },
  learn: `<p>Moths have been hunted by bats for tens of millions of years, and many have <b>ears</b> tuned to bat calls. A moth's ear has only a few sound-sensing cells, yet it is enough. A faint call far away makes a moth turn away. A loud call close by makes it dive, loop or fold its wings. Because a call travels one way to the moth, while the bat must hear the echo of a call that went out and back, the moth can often hear the bat first.</p>
    <p>Some tiger moths answer with <b>clicks</b>. In one well-studied species, the clicks disrupt a big brown bat's ranging, and the bats often miss by roughly 15 to 20 centimetres. Some bats counter with <b>stealth</b>: the barbastelle uses calls up to about 100 times quieter, so moths hear it only when it is a few metres away, though it also hears less far.</p>
    <p>Bats are not the only echolocators. <b>Toothed whales</b> such as dolphins send out clicks and listen for the echoes. <b>Oilbirds</b> and some swiftlets click their way through dark caves, at a pitch people can hear. And <b>bats are not blind</b>: all bats can see, and many use vision as well as sound, whatever the old saying claims.</p>
    <p>A new danger comes from a fungus. <b>White-nose syndrome</b> was first found in New York in 2006 and has killed millions of hibernating bats in North America. Protecting winter caves and slowing the spread of the fungus is part of conservation.</p>
    <p class="tip"><b>Try it:</b> pick a moth, change how loudly the bat calls, and press fly. The amber circle is how far away the moth can hear the bat; the cyan one is how far the bat can hear the moth.</p>
    <p class="note">The ranges come from a toy model with round numbers, not measurements of real animals.</p>`,
  terms: [
    { t: 'Eared moth', d: 'A moth with simple ears that detect bat calls, and flies away or dives when it hears one.' },
    { t: 'Jamming', d: 'Clicks from a tiger moth that disturb a bat’s estimate of how far away the moth is.' },
    { t: 'Stealth echolocation', d: 'Calls much quieter than usual, so prey hears the bat only when it is close.' },
    { t: 'White-nose syndrome', d: 'A disease of hibernating bats caused by a fungus, first found in New York in 2006.' },
  ],
  defaults: { loud: 110, moth: 'eared' },
  controls: [
    { key: 'moth', type: 'seg', label: 'The moth', options: Object.entries(TYPES).map(([v, t]) => ({ v, label: t.n })) },
    { key: 'loud', type: 'range', label: 'Call loudness at 10 cm', min: 60, max: 130, step: 1, fmt: (v) => v.toFixed(0) + ' dB' },
    { key: 'fly', type: 'buttons', label: 'Hunt', items: [{ label: 'Fly the encounter', act: (s, inst) => inst.reset() }, { label: 'Whisper (80 dB)', act: (s, inst) => { s.loud = 80; inst.reset(); } }, { label: 'Loud (110 dB)', act: (s, inst) => { s.loud = 110; inst.reset(); } }] },
  ],
  quiz: [
    { q: 'Why can a moth often hear a bat before the bat hears the moth’s echo?', options: ['Moths have better ears', 'The call goes one way, while the echo has to go out and back', 'Bats are quiet', 'Moths are bigger'], answer: 1, why: 'Sound fades as it spreads. A call that goes out and back is far fainter than one that goes only to the moth.' },
    { q: 'Which is true of bats?', options: ['They are blind', 'They can all see, and many use vision too', 'They cannot hear', 'They only fly in total darkness'], answer: 1, why: 'The old saying about blind bats is a myth. Echolocation adds to sight.' },
    { q: 'Which of these also use echolocation?', options: ['Dolphins and oilbirds', 'Sparrows', 'Cats', 'Pigeons'], answer: 0, why: 'Toothed whales and oilbirds echolocate, and so do some swiftlets and shrews.' },
  ],
  reel: [
    { ms: 6200, caption: 'A moth hears a bat farther away than the bat hears the moth, and dives.', set: { loud: 110, moth: 'eared' }, act: (s, inst) => inst.reset(), view: { pos: [-2.5, 8, 13], target: [-2.5, 4.4, 0] }, spin: 0 },
    { ms: 6200, caption: 'So some bats whisper, getting close before the moth can hear them.', set: { loud: 80, moth: 'eared' }, act: (s, inst) => inst.reset(), view: { pos: [-2.5, 8, 13], target: [-2.5, 4.4, 0] }, spin: 0 },
    { ms: 6200, caption: 'Tiger moths click back and can jam the bat’s sonar.', set: { loud: 110, moth: 'tiger' }, act: (s, inst) => inst.reset(), view: { pos: [-2.5, 8, 13], target: [-2.5, 4.4, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false; stage.scene.background = new THREE.Color(0x090b12); stage.setShift(0, 0);
    const root = stage.root, H = 6;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), M.matte(0x0d1510)); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 0); root.add(ground);
    for (let i = 0; i < 11; i++) { const g = new THREE.Group(); const a = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6), M.matte(COL.bark)); a.position.y = 0.4; const b = new THREE.Mesh(new THREE.ConeGeometry(0.35 + (i % 3) * 0.08, 1.1, 8), M.matte(0x28502f)); b.position.y = 1.2; g.add(a, b); g.position.set(-10 + i * 1.6, 0, -2.2 - (i % 2) * 0.6); root.add(g); }
    const bat = makeBat(0.9), moth = makeMoth(1.0); root.add(bat, moth);
    const ringDb = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 96).rotateX(-Math.PI / 2), M.glow(COL.cyan, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    const ringDm = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 96).rotateX(-Math.PI / 2), M.glow(COL.amber, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    const fillDm = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), M.ghost(COL.amber, 0.07)), fillDb = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), M.ghost(COL.cyan, 0.13));
    root.add(ringDb, ringDm, fillDm, fillDb);
    const pulses = new Pulses(root, 16, { flat: true });
    const clicks = new Pulses(root, 12, { flat: true });
    stage.label('Bat', [0, 0.5, 0], bat); stage.label('Moth', [0, 0.5, 0], moth, 'hot');
    const st0 = {}; let tt = 0, nextCall = 0, nextClick = 0, outcomeT = 0, sig = '';
    const sim = { bx: -14, by: H, bz: 0, mx: 0, my: H, mz: 1.4, state: 'fly', msg: '', hearT: -1, jam: false };
    const ranges = (st) => ({ Dm: range((d) => callAt(st.loud, d), THR_MOTH), Db: range((d) => echoAt(st.loud, d), THR_BAT) });
    const reset = () => { Object.assign(sim, { bx: -14, by: H, bz: 0, mx: 0, my: H, mz: 1.4, state: 'fly', msg: '', hearT: -1, jam: false }); pulses.clear(); clicks.clear(); nextCall = tt; };
    const upd = (dt, st) => {
      const { Dm, Db } = ranges(st), D = Math.hypot(sim.mx - sim.bx, sim.my - sim.by, sim.mz - sim.bz);
      if (sim.state !== 'fly') { outcomeT += dt; if (outcomeT > 2.6) { outcomeT = 0; reset(); } return { Dm, Db, D }; }
      const k = dt * SIM;
      const heard = st.moth !== 'deaf' && D <= Dm;
      if (heard && sim.hearT < 0) sim.hearT = tt;
      // moth
      let mvx = -0.4, mvy = 0, mvz = -0.2;
      if (heard && st.moth === 'eared') { mvx = 1.2; mvy = -4.2; mvz = 1.5 * Math.sin(tt * 6); }
      if (heard && st.moth === 'tiger') { mvx = 0.6; mvy = 0.3; mvz = 0.4; sim.jam = D < 3; }
      sim.mx += mvx * k; sim.my += mvy * k; sim.mz += mvz * k;
      // bat: straight until it detects the moth, then pursues (a jammed bat's aim is off by about 18 cm)
      const detect = D <= Db;
      let dx = 1, dy = 0, dz = 0;
      if (detect) { const off = sim.jam ? 0.9 : 0; const ax = sim.mx - sim.bx, ay = sim.my - sim.by, az = sim.mz - sim.bz + off; const l = Math.hypot(ax, ay, az) || 1; dx = ax / l; dy = ay / l; dz = az / l; }
      sim.bx += dx * VB * k; sim.by += dy * VB * k; sim.bz += dz * VB * k;
      const D2 = Math.hypot(sim.mx - sim.bx, sim.my - sim.by, sim.mz - sim.bz);
      if (D2 < 0.35 && !sim.jam) { sim.state = 'caught'; sim.msg = 'Caught.'; }
      else if (sim.jam && D2 < 0.5) { sim.state = 'missed'; sim.msg = 'Missed: the clicks jammed the bat’s ranging.'; }
      else if (sim.my < 0.6) { sim.state = 'escaped'; sim.msg = 'Escaped into the leaves: the moth heard the bat in time.'; }
      else if (sim.bx > 6) { sim.state = 'passed'; sim.msg = 'The bat never found the moth.'; }
      return { Dm, Db, D: D2 };
    };
    let last = { Dm: 0, Db: 0, D: 0 };
    return {
      dispose() { clearHuds(); },
      reset() { reset(); outcomeT = 0; },
      update(dt, st) {
        tt += dt; last = upd(dt, st);
        const { Dm, Db } = last;
        bat.position.set(sim.bx * F, sim.by * F, sim.bz * F); bat.flap(tt * 11, 0.5); bat.rotation.z = 0;
        moth.position.set(sim.mx * F, sim.my * F, sim.mz * F); moth.flap(tt * 42, 0.9);
        const col = st.moth === 'tiger' ? 0xff7a59 : COL.moth; moth.traverse((o) => { if (o.material && o.material.color && o.geometry?.type === 'ShapeGeometry') o.material.color.setHex(col); });
        const y = bat.position.y;
        ringDb.position.set(bat.position.x, y, bat.position.z); ringDb.scale.setScalar(Math.max(0.01, Db * F));
        ringDm.position.copy(ringDb.position); ringDm.scale.setScalar(Math.max(0.01, Dm * F));
        fillDb.position.copy(ringDb.position); fillDb.scale.copy(ringDb.scale); fillDm.position.copy(ringDb.position); fillDm.scale.copy(ringDm.scale);
        ringDm.visible = fillDm.visible = st.moth !== 'deaf';
        if (sim.state === 'fly' && tt >= nextCall) { nextCall = tt + 0.28; pulses.spawn({ pos: [bat.position.x + 0.3, y, bat.position.z], t0: tt, speed: 5, max: 4, color: 0xffffff, amp: 0.45 }); }
        if (sim.state === 'fly' && st.moth === 'tiger' && last.D <= Dm && tt >= nextClick) { nextClick = tt + 0.12; clicks.spawn({ pos: [moth.position.x, moth.position.y, moth.position.z], t0: tt, speed: 4, max: 1.8, color: COL.amber, amp: 0.7 }); }
        pulses.update(tt); clicks.update(tt);
      },
      readout(st) {
        const { Dm, Db } = ranges(st), who = st.moth === 'deaf' ? 'The moth cannot hear the bat.' : Dm > Db ? 'The moth hears the bat first.' : 'The bat gets there first.';
        return `<div class="big">${sim.msg || (TYPES[st.moth].n + ': ' + TYPES[st.moth].say)}</div>
          <p class="r-say">${who}</p>
          <div class="row"><span>Bat call at 10 cm</span><b>${st.loud.toFixed(0)} dB</b></div>
          <div class="row"><span>Moth hears the bat from about</span><b>${st.moth === 'deaf' ? 'no distance' : Dm.toFixed(1) + ' m'}</b></div>
          <div class="row"><span>Bat hears the moth’s echo from about</span><b>${Db.toFixed(1) } m</b></div>
          <div class="row"><span>Distance now</span><b>${last.D.toFixed(1)} m</b></div>`;
      },
    };
  },
};
