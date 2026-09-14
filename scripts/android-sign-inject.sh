#!/usr/bin/env bash
# Idempotently injects a release signingConfig into the GENERATED Android Gradle
# build file. src-tauri/gen is disposable (gitignored), so this re-applies the
# signing config after every `tauri android init` / fresh checkout.
#
# The injected Kotlin reads .signing/keystore.properties at configuration time and
# only signs when that file exists, so it is safe to inject unconditionally.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GRADLE_FILE="$REPO_ROOT/src-tauri/gen/android/app/build.gradle.kts"
MARKER="tauri-signing-injected"

if [ ! -f "$GRADLE_FILE" ]; then
  echo "ERROR: $GRADLE_FILE not found. Run 'tauri android init' first." >&2
  exit 1
fi

if grep -q "$MARKER" "$GRADLE_FILE"; then
  echo "Signing config already present in build.gradle.kts."
  exit 0
fi

tmp="$GRADLE_FILE.tmp.$$"
awk '
  { print }
  /^android[[:space:]]*\{/ && !done {
    print "    // >>> tauri-signing-injected (managed by scripts/android-sign-inject.sh) - do not edit"
    print "    val signingPropsFile = rootProject.file(\"../../../.signing/keystore.properties\")"
    print "    if (signingPropsFile.exists()) {"
    print "        val signingProps = Properties()"
    print "        signingPropsFile.inputStream().use { signingProps.load(it) }"
    print "        signingConfigs.create(\"release\") {"
    print "            keyAlias = signingProps.getProperty(\"keyAlias\")"
    print "            keyPassword = signingProps.getProperty(\"keyPassword\") ?: signingProps.getProperty(\"password\")"
    print "            storeFile = file(signingProps.getProperty(\"storeFile\"))"
    print "            storePassword = signingProps.getProperty(\"storePassword\") ?: signingProps.getProperty(\"password\")"
    print "        }"
    print "        buildTypes.getByName(\"release\").signingConfig = signingConfigs.getByName(\"release\")"
    print "    }"
    print "    // <<< tauri-signing-injected"
    done = 1
  }
' "$GRADLE_FILE" > "$tmp"
mv "$tmp" "$GRADLE_FILE"
echo "Injected release signing config into build.gradle.kts."
