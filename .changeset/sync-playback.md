---
'donechime': patch
---

Fix sounds not playing from Claude Code hooks: play synchronously instead of in a detached process that was killed when the hook exited.
