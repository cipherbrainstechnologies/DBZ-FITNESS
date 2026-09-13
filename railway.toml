# Saiyan Ascend — Railway monorepo index (documentation only).
#
# Do NOT put [build]/[deploy] here. A root railway.toml with dockerfilePath
# causes EVERY GitHub-linked service to build the same image (previously
# apps/api), which makes @saiyan/web and @saiyan/worker run the API binary.
#
# Per-service Config as Code (set in Railway dashboard → Service → Settings):
#   @saiyan/api    → /apps/api/railway.toml
#   @saiyan/web    → /apps/web/railway.toml
#   @saiyan/worker → /apps/worker/railway.toml
#
# Alternative: set service variable RAILWAY_DOCKERFILE_PATH=apps/<service>/Dockerfile
# and leave Config as Code path empty.
#
# Shared monorepo rules:
#   - Leave each app service Root Directory empty (repo root).
#   - Inject DATABASE_URL / REDIS_URL from private networking references.
#   - Mobile (apps/mobile) is NOT a Railway web service — remove if created by mistake.
#
# Status: production project sparkling-intuition is live; keep this file as an index only.
