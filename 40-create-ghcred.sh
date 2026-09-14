#!/bin/sh
set -e

# =============================================================================
# GitHub OAuth configuration: injects client credentials into nginx config and
# the SPA bundle. Runs before 50-configure-app.sh, whose public-path
# replacement rewrites the /myAppPlaceholder token in the callback URL.
# =============================================================================

# Pass these at docker run time:
#   -e GH_APP_CLIENT_ID=your_client_id
#   -e GH_APP_CLIENT_SECRET=your_client_secret
#   -e GH_APP_CALL_BACK=http://localhost:8080/myAppPlaceholder/callback
# Using /myAppPlaceholder in the callback URL allows the public-path
# replacement in 50-configure-app.sh to rewrite it to the actual subpath.
GH_CLIENT_ID="${GH_APP_CLIENT_ID:-}"
GH_CLIENT_SECRET="${GH_APP_CLIENT_SECRET:-}"
GH_CALLBACK_URL="${GH_APP_CALL_BACK:-}"

# Runtime nginx variables consumed by nginx.conf. Created here (>) —
# 50-configure-app.sh appends the PUBLIC_PATH variable afterwards.
# The client secret lives only inside the container — never in the SPA.
cat > /GH_OAUTH_CLIENT.conf <<EOT
set \$CLIENT_ID "$GH_CLIENT_ID";
set \$CLIENT_SECRET "$GH_CLIENT_SECRET";
set \$CALLBACK_URL "$GH_CALLBACK_URL";
EOT

CLIENT_ID_PREFIX=$(printf '%.4s' "$GH_CLIENT_ID")
echo "Injecting GitHub OAuth config: CLIENT_ID=${CLIENT_ID_PREFIX}**** CALLBACK=${GH_CALLBACK_URL}"

find /usr/share/nginx/html \
  -type f \( -name "*.js" -o -name "*.html" \) -print0 \
| while IFS= read -r -d '' f; do
  sed -i "s|__GH_CLIENT_ID__|${GH_CLIENT_ID}|g" "$f"
  sed -i "s|__GH_CALLBACK_URL__|${GH_CALLBACK_URL}|g" "$f"
done