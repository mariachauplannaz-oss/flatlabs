# FlatLabs

Source code for flatsgenerator.com.

## Branches

- `main`: production (flatsgenerator.com). Only updated through Pull Requests from `staging`.
- `staging`: testing environment (staging--flatlabs.netlify.app), connected to the Neon `staging` database branch.

Workflow: Claude Code branch → PR to `staging` → test on staging → PR `staging` → `main`.
