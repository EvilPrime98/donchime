import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { VERSION, normalizeWav, addHook, removeHooks, resolveSound, throttled } from './index.js';

function makeWav(samples: number[]): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(s, i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0, 'ascii');
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8, 'ascii');
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(44100, 24);
  h.writeUInt32LE(88200, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36, 'ascii');
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

describe('donechime', () => {
  it('exports a VERSION string', () => {
    expect(typeof VERSION).toBe('string');
  });

  it('normalizes peak to the target', () => {
    const r = normalizeWav(makeWav([0, 1000, -2000, 500]), 0.95);
    expect(Math.abs(r.data.readInt16LE(44 + 4))).toBeCloseTo(0.95 * 32768, -1);
  });

  it('rejects non-WAV input', () => {
    expect(() => normalizeWav(Buffer.from('nope'))).toThrow();
  });

  it('adds the hook once and removes it cleanly', () => {
    const base = { theme: 'dark' };
    const added = addHook(addHook(base, 'Stop'), 'Notification');
    expect(added.hooks?.Stop).toHaveLength(1);
    expect(added.hooks?.Notification).toHaveLength(1);
    expect(removeHooks(added)).toEqual(base);
  });

  it('keeps unrelated hooks on uninstall', () => {
    const other = { hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo hi' }] }] } };
    expect(removeHooks(addHook(other, 'Stop'))).toEqual(other);
  });

  it('resolves sounds from config', () => {
    expect(resolveSound('Stop', { Stop: false })).toBeUndefined();
    expect(resolveSound('Stop', { Stop: 'x.wav' })).toBe('x.wav');
    expect(resolveSound('Stop', {})).toMatch(/done\.wav$/);
    expect(resolveSound('PreToolUse', {})).toBeUndefined();
  });

  it('throttles repeats within the cooldown', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dc-'));
    expect(throttled('Stop', 1000, dir, Date.now())).toBe(false);
    expect(throttled('Stop', 1000, dir, Date.now())).toBe(true);
    expect(throttled('Stop', 1000, dir, Date.now() + 5000)).toBe(false);
  });
});
