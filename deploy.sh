#!/bin/sh
# Production deploy: build on Vercel from the pushed commit, then purge the
# Cloudflare edge cache so the HTML cache rule (2h TTL) never serves a stale
# page after a release. The Cloudflare token lives outside the repo.
set -e
cd "$(dirname "$0")"
vercel --prod --yes
ENV_FILE="$HOME/.claude/tools/cloudflare/.env"
ZONE_ID="01d93f0735f5293a8da465d5d896b1c7" # shopbubblemailers.com
if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' | grep -o '"success":[a-z]*' | sed 's/^/cloudflare purge /'
else
  echo "Cloudflare token not found at $ENV_FILE — purge the cache in the dashboard." >&2
fi
