#!/usr/bin/env bash
# Sets up the environment required to build the Tauri Android app.
# Source this file (`. scripts/android-env.sh`) or let scripts/android-build.sh call it.
# Override any value by exporting it before running.

# Android SDK
if [ -z "${ANDROID_HOME:-}" ]; then
  if [ -n "${ANDROID_SDK_ROOT:-}" ]; then
    ANDROID_HOME="$ANDROID_SDK_ROOT"
  elif [ -d "$HOME/Library/Android/sdk" ]; then
    ANDROID_HOME="$HOME/Library/Android/sdk"        # macOS default
  elif [ -d "$HOME/Android/Sdk" ]; then
    ANDROID_HOME="$HOME/Android/Sdk"                # Linux default
  fi
fi
export ANDROID_HOME
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

# Android NDK — pick the highest installed version unless NDK_HOME is set
if [ -z "${NDK_HOME:-}" ] && [ -d "${ANDROID_HOME:-}/ndk" ]; then
  _latest_ndk="$(ls -1 "$ANDROID_HOME/ndk" 2>/dev/null | sort -V | tail -1)"
  [ -n "$_latest_ndk" ] && NDK_HOME="$ANDROID_HOME/ndk/$_latest_ndk"
fi
export NDK_HOME

# JAVA_HOME — Gradle needs JDK 17+; prefer Homebrew openjdk if the current one is too old
if [ -z "${JAVA_HOME:-}" ] || ! "${JAVA_HOME}/bin/java" -version 2>&1 | grep -Eq '"(1[7-9]|2[0-9])'; then
  if [ -d "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home" ]; then
    JAVA_HOME="/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home"   # Apple Silicon
  elif [ -d "/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home" ]; then
    JAVA_HOME="/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home"      # Intel macOS
  fi
fi
export JAVA_HOME
[ -n "${JAVA_HOME:-}" ] && export PATH="$JAVA_HOME/bin:$PATH"
