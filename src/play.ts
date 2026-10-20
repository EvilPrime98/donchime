import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { EVENTS, type HookEvent } from './settings.js';

export const CONFIG_PATH = join(homedir(), '.donechime.json');
export const SOUND_DIR = join(homedir(), '.donechime', 'sounds');

/** Flat config: event name -> wav path (or false to mute), plus a shared cooldown. */
export interface Config {
  cooldownMs?: number;
  [event: string]: string | number | false | undefined;
}

export const DEFAULT_SOUNDS: Record<HookEvent, string> = {
  Stop: join(SOUND_DIR, 'done.wav'),
  Notification: join(SOUND_DIR, 'attention.wav'),
  StopFailure: join(SOUND_DIR, 'failed.wav'),
};
const DEFAULT_COOLDOWN_MS = 2000;

export function loadConfig(path = CONFIG_PATH): Config {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Config;
  } catch {
    return {};
  }
}

/** Resolve the wav to play for `event`, or undefined if muted/unknown. */
export function resolveSound(event: string, config: Config): string | undefined {
  if (!(EVENTS as readonly string[]).includes(event)) return undefined;
  const choice = config[event];
  if (choice === false) return undefined;
  return typeof choice === 'string' ? choice : DEFAULT_SOUNDS[event as HookEvent];
}

/** True if `event` already played within the cooldown; otherwise records this play. */
export function throttled(
  event: string,
  cooldownMs: number,
  dir = tmpdir(),
  now = Date.now(),
): boolean {
  const stamp = join(dir, `donechime-${event}.stamp`);
  try {
    if (now - statSync(stamp).mtimeMs < cooldownMs) return true;
    utimesSync(stamp, new Date(now), new Date(now));
  } catch {
    writeFileSync(stamp, '');
  }
  return false;
}

/** Fire-and-forget playback so the hook never blocks the agent. */
function playDetached(wav: string): void {
  const script = `(New-Object Media.SoundPlayer $env:DONECHIME_WAV).PlaySync()`;
  const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, DONECHIME_WAV: wav },
  });
  child.on('error', () => {});
  child.unref();
}

/** Hook entry point: never throws, never prints, always succeeds. */
export function play(stdin: string, argEvent?: string): void {
  try {
    let event = argEvent;
    if (!event) event = (JSON.parse(stdin) as { hook_event_name?: string }).hook_event_name;
    if (!event) return;
    const config = loadConfig();
    const wav = resolveSound(event, config);
    if (!wav || !existsSync(wav)) return;
    if (throttled(event, config.cooldownMs ?? DEFAULT_COOLDOWN_MS)) return;
    playDetached(wav);
  } catch {
    /* a sound hook must never fail the agent */
  }
}
