// Soundtrack for the Swit intro, synthesized with the Web Audio API and rendered offline.
// 96 BPM, A minor. Music from 4s (the reveal), sound effects locked to the visuals.
// Scene starts: 0 hook, 4 reveal, 9 ask, 14 storyboard, 19 review, 25 end.

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const rng = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

export default {
  async build(ctx, { duration }) {
    const sr = ctx.sampleRate, rand = rng(11);
    const T = (n) => n; // seconds, kept explicit for readability

    /* ---------- buses ---------- */
    const MASTER = 0.27;
    const master = ctx.createGain(); master.gain.value = MASTER;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.008; comp.release.value = 0.25;
    const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -6; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.12;
    // Level control goes after the compressors (Web Audio compressors add makeup gain), and carries the final fade.
    const TRIM = 0.75, out = ctx.createGain(); out.gain.value = TRIM;
    master.connect(comp); comp.connect(limiter); limiter.connect(out); out.connect(ctx.destination);
    out.gain.setValueAtTime(TRIM, 0); out.gain.setValueAtTime(TRIM, duration - 2.2); out.gain.linearRampToValueAtTime(0.0, duration - 0.05);

    // reverb: generated impulse (stereo noise with exponential decay, darkened)
    const irLen = Math.floor(sr * 2.8), ir = ctx.createBuffer(2, irLen, sr);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < irLen; i++) { lp += (((rand() * 2 - 1) - lp) * 0.35); d[i] = lp * Math.pow(1 - i / irLen, 3.2); } }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const verbIn = ctx.createGain(); verbIn.gain.value = 0.42; const verbOut = ctx.createGain(); verbOut.gain.value = 0.9;
    verbIn.connect(verb); verb.connect(verbOut); verbOut.connect(master);

    const padBus = ctx.createGain(); padBus.gain.value = 0.55; padBus.connect(master); padBus.connect(verbIn);
    const bassBus = ctx.createGain(); bassBus.gain.value = 0.9; bassBus.connect(master);
    const drumBus = ctx.createGain(); drumBus.gain.value = 0.9; drumBus.connect(master);
    const fxBus = ctx.createGain(); fxBus.gain.value = 0.8; fxBus.connect(master); fxBus.connect(verbIn);
    const arpBus = ctx.createGain(); arpBus.gain.value = 0.33; arpBus.connect(master); arpBus.connect(verbIn);

    // shared noise buffer
    const nb = ctx.createBuffer(1, sr * 4, sr), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = rand() * 2 - 1;
    const noise = (t0, dur) => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t0, rand() * 2); s.stop(t0 + dur); return s; };
    const env = (g, t0, a, peak, hold, r, end = 0.0001) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + a); g.gain.setValueAtTime(Math.max(peak, 0.0002), t0 + a + hold); g.gain.exponentialRampToValueAtTime(end, t0 + a + hold + r); };

    /* ---------- instruments ---------- */
    const pad = (t0, dur, notes, vol = 0.12) => {
      for (const n of notes) for (const det of [-7, 7]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.6; f.frequency.setValueAtTime(500, t0); f.frequency.linearRampToValueAtTime(2200, t0 + dur * 0.55); f.frequency.linearRampToValueAtTime(900, t0 + dur + 0.8);
        const g = ctx.createGain(); env(g, t0, 0.9, vol / notes.length, Math.max(0, dur - 1.0), 1.3);
        o.connect(f); f.connect(g); g.connect(padBus); o.start(t0); o.stop(t0 + dur + 2.4);
      }
    };
    const bass = (t0, dur, n, vol = 0.5) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = midi(n);
      const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = midi(n + 12);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
      const g = ctx.createGain(); env(g, t0, 0.04, vol, dur * 0.7, 0.35);
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(f); f.connect(bassBus); o.start(t0); o2.start(t0); o.stop(t0 + dur + 0.6); o2.stop(t0 + dur + 0.6);
    };
    const kick = (t0, vol = 0.9) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(165, t0); o.frequency.exponentialRampToValueAtTime(44, t0 + 0.13);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.42);
      o.connect(g); g.connect(drumBus); o.start(t0); o.stop(t0 + 0.45);
      const n = noise(t0, 0.03), nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 3000; const ng = ctx.createGain(); ng.gain.setValueAtTime(0.18 * vol, t0); ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.03);
      n.connect(nf); nf.connect(ng); ng.connect(drumBus);
    };
    const hat = (t0, vol = 0.12, len = 0.05) => {
      const n = noise(t0, len + 0.02), f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0005, t0 + len); n.connect(f); f.connect(g); g.connect(drumBus);
    };
    const clap = (t0, vol = 0.35) => {
      for (let i = 0; i < 3; i++) { const tt = t0 + i * 0.011; const n = noise(tt, 0.12), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 0.8;
        const g = ctx.createGain(); g.gain.setValueAtTime(vol * (i === 2 ? 1 : 0.6), tt); g.gain.exponentialRampToValueAtTime(0.001, tt + (i === 2 ? 0.16 : 0.03)); n.connect(f); f.connect(g); g.connect(drumBus); g.connect(verbIn); }
    };
    const pluck = (t0, n, vol = 0.5, bus = arpBus) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = midi(n);
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = midi(n); o2.detune.value = 6;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(5200, t0); f.frequency.exponentialRampToValueAtTime(700, t0 + 0.3); f.Q.value = 2;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
      const g2 = ctx.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(f);
      o.connect(f); f.connect(g); g.connect(bus); o.start(t0); o2.start(t0); o.stop(t0 + 0.6); o2.stop(t0 + 0.6);
    };
    const bell = (t0, n, vol = 0.3, len = 1.8) => {
      for (const [m, a] of [[1, 1], [2.76, 0.35], [5.4, 0.15]]) {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = midi(n) * m;
        const g = ctx.createGain(); g.gain.setValueAtTime(vol * a, t0); g.gain.exponentialRampToValueAtTime(0.0005, t0 + len / (m > 1 ? 1.8 : 1));
        o.connect(g); g.connect(fxBus); o.start(t0); o.stop(t0 + len + 0.1);
      }
    };
    const blip = (t0, freq, vol = 0.18, len = 0.09) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(freq, t0); o.frequency.exponentialRampToValueAtTime(freq * 1.5, t0 + len * 0.6);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0005, t0 + len); o.connect(g); g.connect(fxBus); o.start(t0); o.stop(t0 + len + 0.02);
    };
    const key = (t0, vol = 0.22) => { // soft keyboard click
      const n = noise(t0, 0.05), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400 + rand() * 1800; f.Q.value = 1.4;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * (0.7 + rand() * 0.5), t0); g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.035);
      n.connect(f); f.connect(g); g.connect(fxBus);
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 180 + rand() * 40; const og = ctx.createGain(); og.gain.setValueAtTime(vol * 0.5, t0); og.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.04); o.connect(og); og.connect(fxBus); o.start(t0); o.stop(t0 + 0.05);
    };
    const whoosh = (t0, dur, vol = 0.5, from = 250, to = 7000) => {
      const n = noise(t0, dur + 0.1), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.1;
      f.frequency.setValueAtTime(from, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur + 0.08);
      n.connect(f); f.connect(g); g.connect(fxBus);
    };
    const riser = (t0, dur, vol = 0.3) => {
      const n = noise(t0, dur + 0.1), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.5; f.frequency.setValueAtTime(400, t0); f.frequency.exponentialRampToValueAtTime(9000, t0 + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur); g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur + 0.05); n.connect(f); f.connect(g); g.connect(fxBus);
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(880, t0 + dur);
      const of = ctx.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 1800; const og = ctx.createGain(); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(vol * 0.35, t0 + dur); og.gain.exponentialRampToValueAtTime(0.0005, t0 + dur + 0.05);
      o.connect(of); of.connect(og); og.connect(fxBus); o.start(t0); o.stop(t0 + dur + 0.1);
    };
    const impact = (t0, vol = 0.9) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(95, t0); o.frequency.exponentialRampToValueAtTime(34, t0 + 0.7);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.6); o.connect(g); g.connect(drumBus); g.connect(verbIn); o.start(t0); o.stop(t0 + 1.7);
      const n = noise(t0, 1.2), f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(5200, t0); f.frequency.exponentialRampToValueAtTime(200, t0 + 1.0);
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.5 * vol, t0); ng.gain.exponentialRampToValueAtTime(0.001, t0 + 1.1); n.connect(f); f.connect(ng); ng.connect(fxBus);
    };
    const drone = (t0, dur) => {
      for (const [n, vol] of [[33, 0.34], [45, 0.14], [52, 0.05]]) {
        const o = ctx.createOscillator(); o.type = n === 33 ? 'sine' : 'sawtooth'; o.frequency.value = midi(n);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; const g = ctx.createGain(); env(g, t0, 1.6, vol, Math.max(0, dur - 2.2), 0.6);
        o.connect(f); f.connect(g); g.connect(bassBus); g.connect(verbIn); o.start(t0); o.stop(t0 + dur + 0.7);
      }
    };

    /* ---------- timeline ---------- */
    const beat = 60 / 96, bar = beat * 4;   // 0.625s, 2.5s
    const M0 = 4.0;                         // music starts with the reveal
    const chords = [
      { root: 45, notes: [57, 60, 64, 69] },   // Am
      { root: 41, notes: [53, 57, 60, 65] },   // F
      { root: 48, notes: [55, 60, 64, 67] },   // C
      { root: 43, notes: [55, 59, 62, 67] },   // G
    ];
    const END_MUSIC = 25.0;

    // hook: drone, ticks as each line lands, riser, then the impact on the question
    drone(0, 4.2);
    for (const tt of [0.28, 0.78, 1.28]) { key(tt, 0.2); blip(tt + 0.02, 1500, 0.06, 0.06); }
    bell(0.4, 81, 0.12, 1.6);
    riser(1.9, 0.9, 0.34);
    impact(2.82, 0.95);
    bell(2.86, 81, 0.18, 2.4);
    whoosh(3.45, 0.55, 0.45, 300, 8000);

    // pad, bass, drums, arpeggio from the reveal to the end
    for (let b = 0, t0 = M0; t0 < END_MUSIC + 0.01; b++, t0 += bar) {
      const c = chords[b % 4], len = Math.min(bar, END_MUSIC - t0 + 0.6);
      pad(t0, len + 0.6, c.notes, 0.30);
      bass(t0, beat * 1.5, c.root, 0.62); bass(t0 + beat * 2.5, beat * 0.9, c.root, 0.45); bass(t0 + beat * 3, beat * 0.9, c.root + (b % 2 ? 7 : 12), 0.38);
      for (let q = 0; q < 4; q++) {
        const tk = t0 + q * beat;
        if (tk < END_MUSIC - 0.2) {
          kick(tk, q === 0 ? 0.95 : 0.78);
          // duck the pad on each kick
          padBus.gain.setValueAtTime(0.55, tk); padBus.gain.linearRampToValueAtTime(0.26, tk + 0.03); padBus.gain.linearRampToValueAtTime(0.55, tk + beat * 0.85);
          hat(tk + beat / 2, 0.11, 0.045);
          if (q === 1 || q === 3) clap(tk, 0.2);
          if (t0 >= 9 && (q === 0 || q === 2)) hat(tk + beat * 0.25, 0.05, 0.03);
        }
      }
      // 8th note arpeggio, softer in the reveal, fuller after the ask scene
      if (t0 >= 9) for (let i = 0; i < 8; i++) { const tk = t0 + i * beat / 2; if (tk < END_MUSIC - 0.3) pluck(tk, c.notes[[0, 1, 2, 3, 2, 1, 2, 3][i]] + 12, i % 2 ? 0.26 : 0.4); }
    }

    // reveal (4 to 9): whoosh into the icon pop, wordmark sparkle, pills
    whoosh(3.5, 0.55, 0.6, 250, 9000);
    bell(4.3, 81, 0.28, 2.2); bell(4.45, 88, 0.2, 2.0);
    for (let i = 0; i < 4; i++) blip(4.4 + i * 0.07, 1500 + i * 420, 0.07, 0.07);
    for (let i = 0; i < 3; i++) { blip(6.1 + i * 0.35, 1300 + i * 260, 0.2, 0.1); bell(6.1 + i * 0.35, 93 + i * 2, 0.07, 0.8); }

    // ask (9 to 14): transition, typing, reply chips
    whoosh(8.5, 0.5, 0.55, 300, 8000);
    for (let i = 0; i < 43; i++) key(9.9 + i * (1.5 / 43) + rand() * 0.015, 0.2);
    key(11.5, 0.3);
    bell(11.6, 86, 0.14, 1.4);
    for (let i = 0; i < 4; i++) { blip(12.1 + i * 0.3, 900 + i * 180, 0.2, 0.1); bell(12.1 + i * 0.3, 88 + i * 2, 0.06, 0.7); }

    // storyboard (14 to 19): transition, cards land, cursor click, approve chord
    whoosh(13.5, 0.5, 0.55, 300, 8000);
    for (let i = 0; i < 5; i++) { const tt = 14.7 + i * 0.18; blip(tt, 520 + i * 90, 0.22, 0.14); kick(tt, 0.35); }
    blip(16.6, 2400, 0.1, 0.05);
    blip(17.9, 1800, 0.35, 0.1); clap(17.9, 0.3);
    bell(17.92, 88, 0.22, 1.6); bell(17.98, 92, 0.18, 1.6);
    riser(17.9, 0.9, 0.18);

    // review (19 to 25): transition, box draws, comment types, click, fix, resolve
    whoosh(18.5, 0.5, 0.55, 300, 8000);
    whoosh(19.9, 0.7, 0.28, 800, 5000);          // box draws itself
    blip(20.65, 1800, 0.22, 0.09);                // badge pops
    for (let i = 0; i < 26; i++) key(21.1 + i * (0.9 / 26) + rand() * 0.01, 0.16);
    blip(22.78, 2200, 0.3, 0.07); clap(22.78, 0.22);   // click
    whoosh(23.0, 0.6, 0.35, 400, 6000);
    for (let i = 0; i < 6; i++) pluck(23.05 + i * 0.07, 76 + i * 2 + (i % 2) * 2, 0.4, fxBus); // code edit run
    whoosh(23.3, 0.5, 0.6, 200, 5000);
    impact(23.35, 0.55);                           // logo pops
    for (const [dt, n] of [[0, 81], [0.1, 85], [0.2, 88], [0.3, 93]]) bell(23.7 + dt, n, 0.26, 2.0);   // resolved chime

    // end (25 to 30): riser into the final chord, tagline, link
    riser(23.9, 1.1, 0.4);
    whoosh(24.5, 0.55, 0.65, 250, 9000);
    pad(25.0, 4.2, [45, 57, 60, 64, 71], 0.45);
    bass(25.0, 3.0, 33, 0.7);
    impact(25.0, 0.8);
    for (const [dt, n] of [[0.4, 81], [0.55, 84], [0.7, 88], [0.85, 93]]) bell(25.0 + dt, n, 0.22, 2.4);
    for (let i = 0; i < 5; i++) blip(25.9 + i * 0.07, 1400 + i * 350, 0.07, 0.07);
    pluck(26.6, 81, 0.5, fxBus); pluck(26.75, 88, 0.4, fxBus);
    blip(27.4, 2000, 0.2, 0.08); bell(27.4, 93, 0.16, 1.6);
    bell(28.2, 81, 0.12, 2.0);
  },
};
