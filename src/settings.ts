export const HOOK_COMMAND = 'donechime play';
/** Command written by pre-0.1 builds; still recognised so install/uninstall can replace it. */
const LEGACY_COMMAND =
  '(New-Object Media.SoundPlayer "$env:USERPROFILE\\.claude\\sounds\\done.wav").PlaySync()';

export const EVENTS = ['Stop', 'Notification', 'StopFailure'] as const;
export type HookEvent = (typeof EVENTS)[number];

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
  hooks?: Record<string, HookGroup[] | undefined>;
  [key: string]: unknown;
}

const isOurs = (h: HookEntry): boolean =>
  h.command === HOOK_COMMAND || h.command === LEGACY_COMMAND;

/** Add the hook for `event`, leaving other settings and hooks untouched. Idempotent. */
export function addHook(settings: Settings, event: HookEvent): Settings {
  const hooks = settings.hooks ?? {};
  const groups = hooks[event] ?? [];
  if (groups.some((g) => g.hooks?.some((h) => h.command === HOOK_COMMAND))) return settings;
  const kept = groups.map((g) => ({ ...g, hooks: g.hooks?.filter((h) => !isOurs(h)) ?? [] }));
  const entry: HookEntry = {
    type: 'command',
    shell: 'powershell',
    command: HOOK_COMMAND,
    timeout: 5,
  };
  return {
    ...settings,
    hooks: { ...hooks, [event]: [...kept.filter((g) => g.hooks.length > 0), { hooks: [entry] }] },
  };
}

/** Remove only the hooks this package added, pruning empty containers. */
export function removeHooks(settings: Settings): Settings {
  if (!settings.hooks) return settings;
  const hooks: Record<string, HookGroup[]> = {};
  for (const [event, groups] of Object.entries(settings.hooks)) {
    const kept = (groups ?? [])
      .map((g) => ({ ...g, hooks: g.hooks?.filter((h) => !isOurs(h)) ?? [] }))
      .filter((g) => g.hooks.length > 0);
    if (kept.length > 0) hooks[event] = kept;
  }
  const { hooks: _old, ...others } = settings;
  void _old;
  return Object.keys(hooks).length > 0 ? { ...others, hooks } : others;
}
