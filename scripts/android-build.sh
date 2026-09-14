#!/usr/bin/env bash
# Build the Tauri Android app (APK + AAB) with the correct environment and,
# when a keystore is configured, signed release output.
#
# src-tauri/gen is disposable (gitignored). This script therefore:
#   1. runs `tauri android init` if the Android project is missing,
#   2. generates the keystore if ANDROID_KEYSTORE_PASSWORD is set and none exists,
#   3. injects the signing config into the generated build.gradle.kts,
#   4. builds.
#
# Usage: ./scripts/android-build.sh [extra tauri args]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$REPO_ROOT/src-tauri/gen/android"
PROPS_FILE="$REPO_ROOT/.signing/keystore.properties"

# shellcheck source=./android-env.sh
. "$SCRIPT_DIR/android-env.sh"

if [ -z "${ANDROID_HOME:-}" ]; then
  echo "ERROR: ANDROID_HOME could not be determined. Install the Android SDK or export ANDROID_HOME." >&2
  exit 1
fi
if [ -z "${NDK_HOME:-}" ]; then
  echo "ERROR: NDK_HOME could not be determined. Install an NDK via sdkmanager or export NDK_HOME." >&2
  exit 1
fi

echo "ANDROID_HOME=$ANDROID_HOME"
echo "NDK_HOME=$NDK_HOME"
echo "JAVA_HOME=${JAVA_HOME:-<unset>}"

# 1. Generate the Android project if it does not exist (gen/ is gitignored).
if [ ! -d "$ANDROID_DIR" ]; then
  echo "Android project missing — running 'tauri android init'..."
  npx tauri android init
fi

# 2. Create the keystore automatically if a password is provided and none exists.
if [ ! -f "$PROPS_FILE" ] && [ -n "${ANDROID_KEYSTORE_PASSWORD:-}" ]; then
  "$SCRIPT_DIR/android-keystore.sh"
fi

# 3. (Re)inject the signing config into the generated Gradle build.
"$SCRIPT_DIR/android-sign-inject.sh"

if [ -f "$PROPS_FILE" ]; then
  echo "Signing: release build will be SIGNED (.signing/keystore.properties found)."
else
  echo "Signing: NONE — output APK/AAB will be UNSIGNED."
  echo "         Run 'export ANDROID_KEYSTORE_PASSWORD=... && npm run android:keystore' to enable signing."
fi

# 4. Build.
exec npx tauri android build "$@"
