#!/bin/bash

APK_PATH="$1"

echo "Checking 16KB page-size alignment..."

if [ -z "$APK_PATH" ]; then
  echo "Usage: ./check-16kb.sh <path-to-apk-or-aab>"
  exit 1
fi

if [ ! -f "$APK_PATH" ]; then
  echo "File not found: $APK_PATH"
  exit 1
fi

TEMP_DIR=$(mktemp -d)

# If AAB, convert to APK using bundletool
if [[ "$APK_PATH" == *.aab ]]; then
  echo "Extracting AAB..."
  if [ ! -f "bundletool.jar" ]; then
    echo "Downloading bundletool.jar..."
    curl -L -o bundletool.jar "https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar"
  fi

  java -jar bundletool.jar build-apks --bundle="$APK_PATH" --output=temp.apks --mode=universal

  unzip -q temp.apks -d temp_apk
  APK_PATH="temp_apk/universal.apk"
fi

echo "Extracting native libs..."

unzip -q "$APK_PATH" -d "$TEMP_DIR"

echo "Checking .so alignment..."
find "$TEMP_DIR" -name "*.so" | while read lib; do
  if command -v readelf > /dev/null 2>&1; then
    ALIGN=$(readelf -l "$lib" | grep "LOAD" | awk '{print $3}' | head -1)
    ALIGN_DEC=$((ALIGN))

    if [ $ALIGN_DEC -lt 16384 ]; then
      echo "[FAIL] $(basename "$lib") - Alignment: $ALIGN (needs >= 0x4000)"
    else
      echo "[OK] $(basename "$lib") - Alignment: $ALIGN"
    fi
  else
    echo "readelf not installed. Install via: brew install binutils"
    break
  fi
done

rm -rf "$TEMP_DIR" temp_apk temp.apks

echo "Done!"
