import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SOUNDS, resolveSound, throttled } from './play.js';

describe('resolveSound', () => {
  it('uses the bundled sound by default', () => {
    expect(resolveSound('Stop', {})).toBe(DEFAULT_SOUNDS.Stop);
  });

  it('honors overrides and mute', () => {
    expect(resolveSound('Stop', { Stop: 'a.wav' })).toBe('a.wav');
    expect(resolveSound('Stop', { Stop: false })).toBeUndefined();
  });

  it('ignores unknown events', () => {
    expect(resolveSound('PreToolUse', {})).toBeUndefined();
  });
});

describe('throttled', () => {
  it('blocks repeats within the cooldown only', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dc-'));
    const t = Date.now();
    expect(throttled('Stop', 2000, dir, t)).toBe(false);
    expect(throttled('Stop', 2000, dir, t + 500)).toBe(true);
    expect(throttled('Stop', 2000, dir, t + 5000)).toBe(false);
  });
});
