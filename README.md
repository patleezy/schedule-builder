# Workback Builder

Campaign workback schedule tool with custom work types, owners, phase config, and CSV/PDF exports.

## Local dev
```
npm install && npm run dev
```

## Branch strategy
- `main` → production (Vercel auto-deploys on push)
- `develop` → all work-in-progress

**Never push directly to main.** Always merge from develop.

## Deploy a new version
```bash
# 1. Tag current main before deploying
git checkout main
git tag v1.1.0
git push origin --tags

# 2. Merge develop into main
git merge develop
git push origin main
```

## Rollback options
**Option A — via git tag:**
```bash
git checkout v1.0.0
git checkout -b hotfix/rollback
git checkout main && git merge hotfix/rollback && git push origin main
```
**Option B — via Vercel dashboard:**
Deployments → find last working → "..." → Promote to Production

## Changelog
| Version | Notes |
|---------|-------|
| v1.0.0 | Initial deploy |

| v2.0.0 | 2026-03 | Saved Projects sidebar, Translation tiers (US/Tier1/Worldwide/Custom), title cleanup |

| v2.0.0 | 2026-03 | Saved Projects sidebar, Translation tiers (US/Tier1/Worldwide/Custom), title cleanup |
| v3.0.0 | 2026-03 | Mobile layout, inline save/load bar, corrected locale data |
