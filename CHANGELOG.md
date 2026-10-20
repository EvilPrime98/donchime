# donechime

## 0.1.1

### Patch Changes

- ca15ad9: Fix sounds not playing from Claude Code hooks: play synchronously instead of in a detached process that was killed when the hook exited.

## 0.1.0

### Minor Changes

- 36d0125: Route attention by ear: add `donechime play`, hooks for `Stop`, `Notification` and `StopFailure` with distinct bundled sounds, a per-event cooldown, and an optional `~/.donechime.json` config. Replaces `addStopHook`/`removeStopHook` with `addHook`/`removeHooks`.
