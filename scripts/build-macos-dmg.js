'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');
const binaryPath = path.join(distDir, '.ai-installer-macos-arm64');
const imageRoot = path.join(distDir, '.ai-installer-macos-image');
const dmgPath = path.join(distDir, 'ai-installer-macos-arm64.dmg');
const appRoot = path.join(imageRoot, 'AI Installer.app');
const contentsRoot = path.join(appRoot, 'Contents');
const macOsRoot = path.join(contentsRoot, 'MacOS');
const infoPlistPath = path.join(contentsRoot, 'Info.plist');
const launcherPath = path.join(macOsRoot, 'AI Installer');
const bundledBinaryPath = path.join(macOsRoot, 'ai-installer-macos-arm64');
const pkgPath = path.join(repoRoot, 'node_modules', '.bin', 'pkg');

const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>AI Installer</string>
  <key>CFBundleExecutable</key>
  <string>AI Installer</string>
  <key>CFBundleIdentifier</key>
  <string>com.fe1ix.ai-installer</string>
  <key>CFBundleName</key>
  <string>AI Installer</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>LSUIElement</key>
  <true/>
</dict>
</plist>
`;

const launcher = `#!/bin/sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BINARY="$SCRIPT_DIR/ai-installer-macos-arm64"
if [ ! -x "$BINARY" ]; then
  printf '%s\\n' "AI Installer: bundled installer is missing: $BINARY" >&2
  exit 1
fi
case "\${1-}" in
  --ci|--print-target) exec "$BINARY" "$@" ;;
esac
exec /usr/bin/osascript - "$BINARY" "$@" <<'APPLESCRIPT'
on run argv
  set executablePath to item 1 of argv
  set commandText to quoted form of executablePath
  if (count of argv) > 1 then
    repeat with argumentValue in (items 2 thru -1 of argv)
      set commandText to commandText & space & quoted form of (contents of argumentValue)
    end repeat
  end if
  tell application "Terminal"
    activate
    do script commandText
  end tell
end run
APPLESCRIPT
`;

function run(command, args) {
  execFileSync(command, args, { cwd: repoRoot, stdio: 'inherit' });
}

function remove(pathname) {
  fs.rmSync(pathname, { recursive: true, force: true });
}

if (process.platform !== 'darwin') {
  throw new Error('macOS DMG 构建仅支持在 macOS 上执行');
}

if (!fs.existsSync(pkgPath)) {
  throw new Error(`找不到 pkg CLI: ${pkgPath}`);
}

remove(binaryPath);
remove(imageRoot);
remove(dmgPath);
fs.mkdirSync(imageRoot, { recursive: true });

try {
  run(pkgPath, [
    'install-all.js',
    '--target',
    'node18-macos-arm64',
    '--output',
    binaryPath,
  ]);

  fs.mkdirSync(macOsRoot, { recursive: true });
  fs.writeFileSync(infoPlistPath, infoPlist, 'utf8');
  fs.writeFileSync(launcherPath, launcher, 'utf8');
  fs.chmodSync(launcherPath, 0o755);
  fs.renameSync(binaryPath, bundledBinaryPath);
  fs.chmodSync(bundledBinaryPath, 0o755);

  run('/usr/bin/hdiutil', [
    'create',
    '-volname',
    'AI Installer',
    '-srcfolder',
    imageRoot,
    '-ov',
    '-format',
    'UDZO',
    dmgPath,
  ]);
} finally {
  remove(binaryPath);
  remove(imageRoot);
}

process.stdout.write(`Created ${dmgPath}\n`);
