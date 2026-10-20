// donechime — public API
export const VERSION = '0.0.0';
export { normalizeWav } from './wav.js';
export type { NormalizeResult } from './wav.js';
export { addHook, removeHooks, HOOK_COMMAND, EVENTS } from './settings.js';
export type { Settings, HookEvent } from './settings.js';
export { resolveSound, throttled } from './play.js';
export type { Config } from './play.js';
