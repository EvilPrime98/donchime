export interface NormalizeResult {
  data: Buffer;
  factor: number;
  peakBefore: number;
  peakAfter: number;
}

/** Normalize a 16-bit PCM WAV so its peak sits at `peak` (0-1) of full scale. */
export function normalizeWav(input: Buffer, peak = 0.95): NormalizeResult {
  if (input.toString('ascii', 0, 4) !== 'RIFF' || input.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Not a RIFF/WAVE file');
  }
  let bits = 0;
  let dataStart = -1;
  let dataLen = 0;
  for (let pos = 12; pos + 8 <= input.length;) {
    const id = input.toString('ascii', pos, pos + 4);
    const size = input.readUInt32LE(pos + 4);
    if (id === 'fmt ') {
      const format = input.readUInt16LE(pos + 8);
      if (format !== 1) throw new Error('Only PCM WAV files are supported');
      bits = input.readUInt16LE(pos + 22);
    } else if (id === 'data') {
      dataStart = pos + 8;
      dataLen = Math.min(size, input.length - dataStart);
      break;
    }
    pos += 8 + size + (size % 2);
  }
  if (bits !== 16) throw new Error(`Only 16-bit samples are supported (got ${bits})`);
  if (dataStart < 0) throw new Error('WAV has no data chunk');

  const out = Buffer.from(input);
  const samples = Math.floor(dataLen / 2);
  let max = 0;
  for (let i = 0; i < samples; i++) {
    max = Math.max(max, Math.abs(out.readInt16LE(dataStart + i * 2)));
  }
  if (max === 0) throw new Error('WAV is silent');

  const factor = (peak * 32768) / max;
  for (let i = 0; i < samples; i++) {
    const off = dataStart + i * 2;
    const scaled = Math.round(out.readInt16LE(off) * factor);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, scaled)), off);
  }
  return { data: out, factor, peakBefore: max / 32768, peakAfter: peak };
}
