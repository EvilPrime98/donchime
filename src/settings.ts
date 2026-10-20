export const HOOK_COMMAND =
  '(New-Object Media.SoundPlayer "$env:USERPROFILE\\.claude\\sounds\\done.wav").PlaySync()';

export interface HookEntry {
  type?: string;
  shell?: string;
  command?: string;
  timeout?: number;
}
export interface HookGroup {
  hooks?: HookEntry[];
}
export interface Settings {
  hooks?: { Stop?: HookGroup[]; [event: string]: HookGroup[] | undefined };
  [key: string]: unknown;
}

const isOurs = (h: HookEntry): boolean => h.command === HOOK_COMMAND;

/** Add the Stop hook, leaving other settings and hooks untouched. Idempotent. */
export function addStopHook(settings: Settings): Settings {
  const hooks = settings.hooks ?? {};
  const stop = hooks.Stop ?? [];
  if (stop.some((g) => g.hooks?.some(isOurs))) return settings;
  const entry: HookEntry = {
    type: 'command',
    shell: 'powershell',
    command: HOOK_COMMAND,
    timeout: 10,
  };
  return { ...settings, hooks: { ...hooks, Stop: [...stop, { hooks: [entry] }] } };
}

/** Remove only the hook this package added, pruning empty containers. */
export function removeStopHook(settings: Settings): Settings {
  const { hooks } = settings;
  if (!hooks?.Stop) return settings;
  const stop = hooks.Stop.map((g) => ({
    ...g,
    hooks: g.hooks?.filter((h) => !isOurs(h)) ?? [],
  })).filter((g) => g.hooks.length > 0);
  const { Stop: _removed, ...rest } = hooks;
  void _removed;
  const nextHooks = stop.length > 0 ? { ...rest, Stop: stop } : rest;
  const { hooks: _old, ...others } = settings;
  void _old;
  return Object.keys(nextHooks).length > 0 ? { ...others, hooks: nextHooks } : others;
}
