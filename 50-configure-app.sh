#!/bin/sh
set -e

# =============================================================================
# General app configuration (non-GitHub): public path, imprint, collaborators.
# Runs after 40-create-ghcred.sh.
#
# ORDER MATTERS: all placeholder injections (imprint, collaborators — and the
# OAuth callback injected by 40-create-ghcred.sh) must happen BEFORE the
# public-path replacement below, so that any /myAppPlaceholder token inside
# the injected values is rewritten to the actual subpath as well.
# =============================================================================

# ---- Public path (normalize only; replacement happens further down) ----
# Accept empty = root
APP_PUBLIC_PATH="${APP_PUBLIC_PATH:-}"

# Normalize: allow "", "/" (root) or "/subpath"
case "$APP_PUBLIC_PATH" in
  ""|"/") NORMALIZED_PATH="/" ;;   # empty or "/" means root
  /*)     NORMALIZED_PATH="${APP_PUBLIC_PATH%/}" ;;  # already starts with / but strip off trailing /
  *)      NORMALIZED_PATH="/${APP_PUBLIC_PATH%/}" ;; # prepend / and strip off trailing /
esac

echo "Using APP_PUBLIC_PATH='${APP_PUBLIC_PATH}' (normalized='${NORMALIZED_PATH}')"

# Create symlink for subpath so /demo works by pointing to /
if [ "$NORMALIZED_PATH" != "/" ]; then
  # create parent directories if needed for subsubpaths like /foo/bar/buz
  mkdir -p /usr/share/nginx/html`dirname $NORMALIZED_PATH`
  ln -snf /usr/share/nginx/html "/usr/share/nginx/html$NORMALIZED_PATH"
fi

# ---- Imprint & collaborators injection (BEFORE path replacement) ----
# Pass any of: APP_IMPRINT_INSTITUTION, APP_IMPRINT_STREET, APP_IMPRINT_ZIP,
# APP_IMPRINT_CITY, APP_IMPRINT_COUNTRY, APP_IMPRINT_PHONE,
# APP_IMPRINT_CONTACT_PERSON, APP_IMPRINT_EMAIL, APP_IMPRINT_LINK,
# APP_COLLABORATORS (JSON array of {"name","logo","url"} objects).
# Logo URLs may use the /myAppPlaceholder/ prefix; it is rewritten to the
# actual subpath by the path replacement below.
# If none is set, the placeholders remain and the app shows its built-in
# default imprint and collaborator logos.
replace_app_var () {
  # $1 = placeholder, $2 = value
  [ -z "$2" ] && return 0
  ESCAPED=$(printf '%s' "$2" | sed -e 's/[&|\\"]/\\&/g' | tr '\n' ' ')
  find /usr/share/nginx/html -type f -name "*.js" -print0 \
  | while IFS= read -r -d '' f; do
    sed -i "s|$1|${ESCAPED}|g" "$f"
  done
}

replace_app_var '__APP_IMPRINT_INSTITUTION__'    "${APP_IMPRINT_INSTITUTION:-}"
replace_app_var '__APP_IMPRINT_STREET__'         "${APP_IMPRINT_STREET:-}"
replace_app_var '__APP_IMPRINT_ZIP__'            "${APP_IMPRINT_ZIP:-}"
replace_app_var '__APP_IMPRINT_CITY__'           "${APP_IMPRINT_CITY:-}"
replace_app_var '__APP_IMPRINT_COUNTRY__'        "${APP_IMPRINT_COUNTRY:-}"
replace_app_var '__APP_IMPRINT_PHONE__'          "${APP_IMPRINT_PHONE:-}"
replace_app_var '__APP_IMPRINT_CONTACT_PERSON__' "${APP_IMPRINT_CONTACT_PERSON:-}"
replace_app_var '__APP_IMPRINT_EMAIL__'          "${APP_IMPRINT_EMAIL:-}"
replace_app_var '__APP_IMPRINT_LINK__'           "${APP_IMPRINT_LINK:-}"

# APP_COLLABORATORS is JSON; base64-encode it so its quotes cannot terminate
# the JS string literal it is injected into (the minifier may quote it with
# either ' or "). Decoded again by the app in resolveCollaborators().
if [ -n "${APP_COLLABORATORS:-}" ]; then
  COLLAB_B64=$(printf '%s' "$APP_COLLABORATORS" | base64 | tr -d '\n')
  replace_app_var '__APP_COLLABORATORS__' "$COLLAB_B64"
fi

if [ -n "${APP_IMPRINT_INSTITUTION:-}${APP_IMPRINT_STREET:-}${APP_IMPRINT_ZIP:-}${APP_IMPRINT_CITY:-}${APP_IMPRINT_COUNTRY:-}${APP_IMPRINT_PHONE:-}${APP_IMPRINT_CONTACT_PERSON:-}${APP_IMPRINT_EMAIL:-}${APP_IMPRINT_LINK:-}" ]; then
  echo "Injecting custom imprint"
fi

if [ -n "${APP_COLLABORATORS:-}" ]; then
  echo "Injecting custom collaborators"
fi

# ---- Replace public-path placeholders in built files ----
# Runs AFTER all injections so that /myAppPlaceholder tokens inside injected
# values (collaborator logo URLs, OAuth callback) are rewritten too.
PLACEHOLDER="/myAppPlaceholder"

find /usr/share/nginx/html \
  -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) -print0 \
| while IFS= read -r -d '' f; do
  sed -i "s|${PLACEHOLDER}/|${NORMALIZED_PATH%/}/|g" "$f" # %/ removes trailing slash for correct replacement
  sed -i "s|${PLACEHOLDER}|${NORMALIZED_PATH}|g" "$f"
done

# replace myAppPlaceholder in nginx configuration and in the injected OAuth conf
for cfg in /etc/nginx/nginx.conf /GH_OAUTH_CLIENT.conf; do
  sed -i "s|${PLACEHOLDER}/|${NORMALIZED_PATH%/}/|g" "$cfg"
  sed -i "s|${PLACEHOLDER}|${NORMALIZED_PATH}|g" "$cfg"
done