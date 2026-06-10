/**
 * Synthesized audio for the meltdown — no files, just Web Audio:
 * a low beating rumble that builds, a kick-style thud per NO,
 * near-silence for the dread beat, and a static burst when the line dies.
 *
 * armMeltdownAudio() MUST be called from inside a user gesture (the submit
 * keystroke) or browsers will keep the context muted. Everything else
 * degrades to silence on any failure.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let rumbleGain: GainNode | null = null;
let running: { stop: () => void }[] = [];

export function armMeltdownAudio(): void {
  try {
    type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    if (!master) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp);
      comp.connect(ctx.destination);
    }
  } catch {
    ctx = null;
  }
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Two detuned sub-sines beating against each other + low-passed noise. */
export function startRumble(): void {
  if (!ctx || !master || rumbleGain) return;
  try {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 2.2);

    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 41;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 46.5;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 2);
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 110;
    const ng = ctx.createGain();
    ng.gain.value = 0.35;

    o1.connect(g);
    o2.connect(g);
    noise.connect(lp);
    lp.connect(ng);
    ng.connect(g);
    g.connect(master);

    o1.start();
    o2.start();
    noise.start();
    rumbleGain = g;
    running.push({
      stop: () => {
        o1.stop();
        o2.stop();
        noise.stop();
        g.disconnect();
      },
    });
  } catch {
    /* silence */
  }
}

/** Ramp the rumble — drop near zero for the dread beat, swell for the end. */
export function rumbleTo(level: number, seconds: number): void {
  if (!ctx || !rumbleGain) return;
  try {
    rumbleGain.gain.cancelScheduledValues(ctx.currentTime);
    rumbleGain.gain.setValueAtTime(
      Math.max(rumbleGain.gain.value, 0.0001),
      ctx.currentTime,
    );
    rumbleGain.gain.exponentialRampToValueAtTime(
      Math.max(level, 0.0001),
      ctx.currentTime + seconds,
    );
  } catch {
    /* silence */
  }
}

/** Kick-drum thud: a sine dropping 150→40Hz with a fast decay. */
export function thud(intensity: number): void {
  if (!ctx || !master) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150 + intensity * 60, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
    g.gain.setValueAtTime(0.12 + intensity * 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.36);
  } catch {
    /* silence */
  }
}

/** The line dies: instant rumble cut + a short burst of broadband static. */
export function crashStatic(): void {
  if (!ctx || !master) return;
  try {
    if (rumbleGain) {
      rumbleGain.gain.cancelScheduledValues(ctx.currentTime);
      rumbleGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 0.18);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    src.connect(hp);
    hp.connect(g);
    g.connect(master);
    src.start();
  } catch {
    /* silence */
  }
}

export function stopMeltdownAudio(): void {
  for (const r of running) {
    try {
      r.stop();
    } catch {
      /* already stopped */
    }
  }
  running = [];
  rumbleGain = null;
}
