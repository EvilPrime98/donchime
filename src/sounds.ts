const RATE = 22050;

type Note = [freq: number, ms: number];

/** Render notes as a mono 16-bit PCM WAV with a short fade per note. Original synthesis, no licensing. */
function render(notes: Note[], peak = 0.9): Buffer {
  const chunks = notes.map(([freq, ms]) => {
    const n = Math.floor((RATE * ms) / 1000);
    const out = new Int16Array(n);
    for (let i = 0; i < n; i++) {
      const env = Math.min(1, i / 200, (n - i) / (n * 0.6));
      out[i] = Math.round(Math.sin((2 * Math.PI * freq * i) / RATE) * env * peak * 32767);
    }
    return out;
  });
  const samples = Buffer.concat(chunks.map((c) => Buffer.from(c.buffer)));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0, 'ascii');
  h.writeUInt32LE(36 + samples.length, 4);
  h.write('WAVEfmt ', 8, 'ascii');
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36, 'ascii');
  h.writeUInt32LE(samples.length, 40);
  return Buffer.concat([h, samples]);
}

/** Three distinct cues: done (rising), attention (double beep), failed (falling low). */
export const BUNDLED: Record<string, Buffer> = {
  done: render([
    [659, 140],
    [880, 140],
    [1319, 320],
  ]),
  attention: render([
    [988, 120],
    [0, 60],
    [988, 120],
    [0, 60],
    [988, 200],
  ]),
  failed: render([
    [392, 220],
    [294, 220],
    [196, 420],
  ]),
};
