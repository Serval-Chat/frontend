#!/usr/bin/env bash
set -euo pipefail
# --skip-build: skip all cargo builds, go to packaging
SKIP_BUILD=false
if [[ "${1:-}" == "--skip-build" ]]; then
    SKIP_BUILD=true
fi

read -rp "请输入发布版本号 (例如 v0.7.9): " VERSION
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "错误：版本号格式不正确，必须是 vX.Y.Z（例如 v0.7.9）" >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYSTORE="$(realpath "${SCRIPT_DIR}/../debug.keystore")"
RELEASES_DIR="${SCRIPT_DIR}/releases"
BUILD_WIN="${SCRIPT_DIR}/scripts/build-win.sh"

[[ -f "$KEYSTORE"  ]] || { echo "错误：在 ${KEYSTORE} 找不到 debug.keystore" >&2; exit 1; }
[[ -f "$BUILD_WIN" ]] || { echo "错误：找不到 scripts/build-win.sh" >&2; exit 1; }

for tool in cargo zipalign apksigner; do
    command -v "$tool" &>/dev/null || { echo "错误：在 PATH 中找不到工具 '${tool}'" >&2; exit 1; }
done

if [[ "$SKIP_BUILD" == false ]]; then
    echo "正在构建 Android..."
    cargo tauri android build
    echo "正在构建 Linux..."
    cargo tauri build
    echo "正在构建 Windows..."
    bash "$BUILD_WIN" || { echo "错误：Windows 构建失败" >&2; exit 1; }
    echo "Windows 构建成功。"
else
    echo "已跳过构建步骤（传入了 --skip-build）。"
fi

[[ -d "$RELEASES_DIR" ]] && rm -rf "$RELEASES_DIR"
mkdir -p "$RELEASES_DIR"
echo "正在收集构建产物..."

APK_SRC="$(find "${SCRIPT_DIR}/src-tauri/gen/android" \
    \( -name "*unsigned*.apk" -o -name "*release*.apk" \) 2>/dev/null \
    | grep -v aligned | head -n1)"
DEB_SRC="$(find "${SCRIPT_DIR}/src-tauri/target/release/bundle/deb"           -name "*.deb"      2>/dev/null | head -n1)"
RPM_SRC="$(find "${SCRIPT_DIR}/src-tauri/target/release/bundle/rpm"           -name "*.rpm"      2>/dev/null | head -n1)"
APPIMAGE_SRC="$(find "${SCRIPT_DIR}/src-tauri/target/release/bundle/appimage" -name "*.AppImage" 2>/dev/null | head -n1)"
EXE_SRC="$(find "${SCRIPT_DIR}/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis" \
    -name "*setup*.exe" 2>/dev/null | head -n1)"

[[ -n "$APK_SRC"      ]] || { echo "错误：找不到 APK 文件"           >&2; exit 1; }
[[ -n "$DEB_SRC"      ]] || { echo "错误：找不到 .deb 文件"          >&2; exit 1; }
[[ -n "$RPM_SRC"      ]] || { echo "错误：找不到 .rpm 文件"          >&2; exit 1; }
[[ -n "$APPIMAGE_SRC" ]] || { echo "错误：找不到 .AppImage 文件"     >&2; exit 1; }
[[ -n "$EXE_SRC"      ]] || { echo "错误：找不到 Windows .exe 文件"  >&2; exit 1; }

echo "正在对 APK 进行对齐和签名..."
ALIGNED_APK="${RELEASES_DIR}/aligned.apk"
FINAL_APK="${RELEASES_DIR}/Serchat_${VERSION}.apk"
zipalign -v 4 "$APK_SRC" "$ALIGNED_APK"
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-key-alias androiddebugkey \
    --ks-pass pass:android \
    --key-pass pass:android \
    --out "$FINAL_APK" \
    "$ALIGNED_APK"
rm -f "$ALIGNED_APK"
rm -f "${RELEASES_DIR}/Serchat_${VERSION}.apk.idsig"
echo "APK 签名完成。"

echo "正在复制其他平台文件..."
cp "$DEB_SRC"      "${RELEASES_DIR}/Serchat_${VERSION}.deb"
cp "$RPM_SRC"      "${RELEASES_DIR}/Serchat_${VERSION}.rpm"
cp "$APPIMAGE_SRC" "${RELEASES_DIR}/Serchat_${VERSION}.AppImage"
cp "$EXE_SRC"      "${RELEASES_DIR}/Serchat_${VERSION}.exe"
chmod +x "${RELEASES_DIR}/Serchat_${VERSION}.AppImage"

echo "全部完成！ ${RELEASES_DIR} 中的文件："
ls -lh "${RELEASES_DIR}/"