#!/usr/bin/env bash
# Creates a release keystore + keystore.properties in the stable, gitignored
# .signing/ directory at the repo root (NOT inside src-tauri/gen, which is
# disposable). The build script injects the signing config into the generated
# Gradle project on every build, so this survives `tauri android init`.
#
# Secrets are read ONLY from environment variables (never prompted).
#
# Required env var:
#   ANDROID_KEYSTORE_PASSWORD   store (and key) password
# Optional env vars:
#   ANDROID_KEY_ALIAS           key alias                (default: upload)
#   ANDROID_KEY_PASSWORD        key password             (default: store password)
#   ANDROID_KEY_DNAME           cert distinguished name  (default: CN=org.edirom.cartographer)
#   ANDROID_KEYSTORE_VALIDITY   validity in days         (default: 10000)
#
# If .signing/keystore.properties already exists, this script does nothing.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SIGNING_DIR="$REPO_ROOT/.signing"
PROPS_FILE="$SIGNING_DIR/keystore.properties"
KEYSTORE_FILE="$SIGNING_DIR/release.keystore"

# shellcheck source=./android-env.sh
. "$SCRIPT_DIR/android-env.sh"

if [ -f "$PROPS_FILE" ] && [ -f "$KEYSTORE_FILE" ]; then
  echo "$PROPS_FILE and keystore already exist — leaving them untouched."
  exit 0
fi

# Recover from a half-written state (properties without a keystore, or vice versa).
if [ -f "$PROPS_FILE" ] && [ ! -f "$KEYSTORE_FILE" ]; then
  echo "WARNING: keystore.properties exists but $KEYSTORE_FILE is missing — regenerating." >&2
  rm -f "$PROPS_FILE"
fi

if [ -z "${ANDROID_KEYSTORE_PASSWORD:-}" ]; then
  echo "ERROR: ANDROID_KEYSTORE_PASSWORD is not set. Export it, then re-run:" >&2
  echo "  export ANDROID_KEYSTORE_PASSWORD='your-strong-password'" >&2
  exit 1
fi

KEY_ALIAS="${ANDROID_KEY_ALIAS:-upload}"
KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-$ANDROID_KEYSTORE_PASSWORD}"
DNAME="${ANDROID_KEY_DNAME:-CN=org.edirom.cartographer}"
VALIDITY="${ANDROID_KEYSTORE_VALIDITY:-10000}"

KEYTOOL="keytool"
[ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/keytool" ] && KEYTOOL="$JAVA_HOME/bin/keytool"

mkdir -p "$SIGNING_DIR"

if [ ! -f "$KEYSTORE_FILE" ]; then
  echo "Generating release keystore at $KEYSTORE_FILE ..."
  "$KEYTOOL" -genkeypair -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA -keysize 2048 -validity "$VALIDITY" \
    -storepass "$ANDROID_KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "$DNAME"
else
  echo "Reusing existing keystore at $KEYSTORE_FILE"
fi

umask 077
cat > "$PROPS_FILE" <<EOF
storeFile=$KEYSTORE_FILE
keyAlias=$KEY_ALIAS
storePassword=$ANDROID_KEYSTORE_PASSWORD
keyPassword=$KEY_PASSWORD
EOF

echo "Wrote $PROPS_FILE (gitignored). Release builds will now be signed."
