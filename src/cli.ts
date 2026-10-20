#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { normalizeWav } from './wav.js';
import { addStopHook, removeStopHook, type Settings } from './settings.js';

const claudeDir = join(homedir(), '.claude');
const settingsPath = join(claudeDir, 'settings.json');
const soundPath = join(claudeDir, 'sounds', 'done.wav');
const defaultSource = join(process.env['SystemRoot'] ?? 'C:\\Windows', 'Media', 'tada.wav');

const USAGE = `Usage: claude-stop-sound <install|uninstall> [--source <wav>] [--peak <0-1>]

  install     Create a normalized ~/.claude/sounds/done.wav and add the Stop hook
  uninstall   Remove the hook and done.wav
  --source    WAV to use (default: ${defaultSource})
  --peak      Target peak, 0-1 (default: 0.95)`;

function readSettings(): Settings {
  if (!existsSync(settingsPath)) return {};
  return JSON.parse(readFileSync(settingsPath, 'utf8')) as Settings;
}

function writeSettings(settings: Settings): void {
  mkdirSync(dirname(settingsPath), { recursive: true });
  if (existsSync(settingsPath)) copyFileSync(settingsPath, `${settingsPath}.bak`);
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(args: string[]): number {
  const [cmd] = args;
  if (cmd === 'install') {
    if (process.platform !== 'win32') {
      console.error('The hook uses Windows PowerShell SoundPlayer; Windows only.');
      return 1;
    }
    const peak = Number(flag(args, '--peak') ?? 0.95);
    if (!(peak > 0 && peak <= 1)) {
      console.error('--peak must be in (0, 1]');
      return 1;
    }
    const source = flag(args, '--source') ?? defaultSource;
    const result = normalizeWav(readFileSync(source), peak);
    mkdirSync(dirname(soundPath), { recursive: true });
    writeFileSync(soundPath, result.data);
    writeSettings(addStopHook(readSettings()));
    console.log(`Wrote ${soundPath} (x${result.factor.toFixed(2)}, peak ${peak})`);
    console.log(`Hook added to ${settingsPath} (backup: settings.json.bak)`);
    console.log('If it does not fire, open /hooks once or restart Claude Code.');
    return 0;
  }
  if (cmd === 'uninstall') {
    if (existsSync(settingsPath)) writeSettings(removeStopHook(readSettings()));
    rmSync(soundPath, { force: true });
    console.log('Removed Stop hook and done.wav');
    return 0;
  }
  console.log(USAGE);
  return cmd === undefined || cmd === '--help' || cmd === '-h' ? 0 : 1;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
