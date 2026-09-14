# macOS App Bundle Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the macOS installer inside a Finder-launchable `AI Installer.app` while preserving the existing terminal wizard and Windows artifacts.

**Architecture:** `pkg` continues to produce the arm64 Node executable. The DMG build script places it inside `AI Installer.app/Contents/MacOS/ai-installer-macos-arm64` and adds an executable `AI Installer` launcher plus `Info.plist`. Finder launches the wrapper; normal launches open Terminal and run the bundled binary, while `--print-target` and `--ci` run directly so CI remains deterministic and captures the installer's output.

**Tech Stack:** Node.js 20, `pkg@5.8.1`, POSIX shell, AppleScript via `/usr/bin/osascript`, macOS `hdiutil`, GitHub Actions, Node built-in test runner.

## Global Constraints

- The supported build target remains macOS Apple Silicon (`darwin/arm64`).
- The DMG remains unsigned and unnotarized; app packaging does not remove Gatekeeper requirements.
- Do not disable Gatekeeper or SIP, remove quarantine attributes, use `sudo`, or force-quit applications.
- Keep the public artifact name `dist/ai-installer-macos-arm64.dmg`.
- Preserve existing Node installer behavior, checksum validation, per-user application installation, and Windows artifacts.
- Do not expose `AI Installer.command`, `.cmd`, or a bare Mach-O as the DMG's user-facing entry point.

---

### Task 1: Lock the app-bundle build contract with failing tests

**Files:**
- Modify: `macos-build.test.js:17-58`
- Modify: `scripts/build-macos-dmg.js` only after the red test is observed

**Interfaces:**
- Consumes: the current build-script source and macOS workflow source.
- Produces: executable-contract assertions that require `AI Installer.app`, its `Contents/Info.plist`, its `Contents/MacOS/AI Installer` launcher, and the bundled pkg binary.

- [ ] **Step 1: Replace the old `.command` assertions with app-bundle assertions**

Update the build test so the build-script source must contain:

```js
assert.match(buildScript, /AI Installer\.app/);
assert.match(buildScript, /Contents[\\/]+Info\.plist/);
assert.match(buildScript, /Contents[\\/]+MacOS/);
assert.match(buildScript, /CFBundleIdentifier/);
assert.match(buildScript, /CFBundleExecutable/);
assert.match(buildScript, /osascript/);
assert.match(buildScript, /--ci/);
assert.match(buildScript, /--print-target/);
assert.doesNotMatch(buildScript, /AI Installer\.command/);
```

Update the workflow assertions to require `AI Installer.app`,
`Contents/MacOS/AI Installer`, and `Contents/Info.plist`, and to reject
`AI Installer.command`. Apply the same app-path checks to the macOS section of
`release-all.yml` without altering Windows release tests.

- [ ] **Step 2: Run the focused test and verify the expected red failure**

Run:

```bash
node --test macos-build.test.js
```

Expected: FAIL because the current source still contains `AI Installer.command`
and does not define an `AI Installer.app` bundle.

- [ ] **Step 3: Commit the red tests**

```bash
git add macos-build.test.js
git commit -m "test: require macOS app bundle packaging"
```

---

### Task 2: Build a Finder-launchable `AI Installer.app`

**Files:**
- Modify: `scripts/build-macos-dmg.js:8-63`
- Test: `macos-build.test.js`

**Interfaces:**
- Consumes: `install-all.js`, `pkg@5.8.1`, and the existing DMG output path.
- Produces: a DMG containing `AI Installer.app` with a valid `Info.plist`, an executable launcher, and the arm64 packaged binary.

- [ ] **Step 1: Define the app paths and metadata**

Replace the old image-root launcher paths with:

```js
const appRoot = path.join(imageRoot, 'AI Installer.app');
const contentsRoot = path.join(appRoot, 'Contents');
const macOsRoot = path.join(contentsRoot, 'MacOS');
const infoPlistPath = path.join(contentsRoot, 'Info.plist');
const launcherPath = path.join(macOsRoot, 'AI Installer');
const bundledBinaryPath = path.join(macOsRoot, 'ai-installer-macos-arm64');
```

Write an XML plist containing `CFBundleDisplayName=AI Installer`,
`CFBundleExecutable=AI Installer`,
`CFBundleIdentifier=com.fe1ix.ai-installer`, `CFBundlePackageType=APPL`,
version `1.0.0`, and `LSMinimumSystemVersion=12.0`. Set `LSUIElement` to true
so the wrapper does not leave a separate Dock application after opening
Terminal.

- [ ] **Step 2: Add the launcher with direct CI modes and Terminal launch behavior**

Write `Contents/MacOS/AI Installer` as an executable POSIX shell script:

```sh
#!/bin/sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BINARY="$SCRIPT_DIR/ai-installer-macos-arm64"
if [ ! -x "$BINARY" ]; then
  printf '%s\n' "AI Installer: bundled installer is missing: $BINARY" >&2
  exit 1
fi
case "${1-}" in
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
```

This passes arguments as an AppleScript list and quotes each argument before
Terminal executes it. Normal Finder launches return after Terminal creates the
command; `--ci` and `--print-target` execute synchronously.

- [ ] **Step 3: Move the pkg output into the app and create the DMG**

After `pkg` creates the temporary binary, create the app directories, write the
plist and launcher, set both files executable, and rename the binary to
`bundledBinaryPath`:

```js
fs.mkdirSync(macOsRoot, { recursive: true });
fs.writeFileSync(infoPlistPath, infoPlist, 'utf8');
fs.writeFileSync(launcherPath, launcher, 'utf8');
fs.chmodSync(launcherPath, 0o755);
fs.renameSync(binaryPath, bundledBinaryPath);
fs.chmodSync(bundledBinaryPath, 0o755);
```

Keep the existing `hdiutil create` invocation and remove `binaryPath` and
`imageRoot` before the build and in `finally`. The DMG source root must contain
only `AI Installer.app`.

- [ ] **Step 4: Run focused tests and syntax validation**

Run:

```bash
node --test macos-build.test.js
node --check scripts/build-macos-dmg.js
```

Expected: all focused tests pass and syntax validation exits 0.

- [ ] **Step 5: Commit the build implementation**

```bash
git add scripts/build-macos-dmg.js macos-build.test.js
git commit -m "feat: package macOS installer as app bundle"
```

---

### Task 3: Update macOS CI and release verification

**Files:**
- Modify: `.github/workflows/package-macos-arm64.yml`
- Modify: `.github/workflows/release-all.yml`
- Modify: `macos-build.test.js`

**Interfaces:**
- Consumes: the new app layout and direct `Contents/MacOS/AI Installer` launcher.
- Produces: CI checks that prove the DMG contains a valid app bundle and that the packaged installer still supports `--print-target` and `--ci`.

- [ ] **Step 1: Inspect the app bundle in the package workflow**

Replace the old command-file checks with:

```bash
app_path="$mount_point/AI Installer.app"
test -d "$app_path"
test -x "$app_path/Contents/MacOS/AI Installer"
test -x "$app_path/Contents/MacOS/ai-installer-macos-arm64"
/usr/bin/plutil -lint "$app_path/Contents/Info.plist"
test "$(/usr/bin/plutil -extract CFBundleExecutable raw -o - "$app_path/Contents/Info.plist")" = "AI Installer"
test "$(/usr/bin/plutil -extract CFBundlePackageType raw -o - "$app_path/Contents/Info.plist")" = "APPL"
target="$($app_path/Contents/MacOS/AI Installer --print-target)"
```

Run the CI installation through:

```bash
"$mount_point/AI Installer.app/Contents/MacOS/AI Installer" --ci 2>&1 | tee dist/macos-install-validation.log
```

- [ ] **Step 2: Apply the same app checks to the release workflow**

Make the identical path changes in `.github/workflows/release-all.yml`. Keep the
DMG name, evidence names, checksum behavior, and public release allowlist
unchanged.

- [ ] **Step 3: Update workflow tests**

Require `AI Installer.app`, `Contents/MacOS/AI Installer`,
`Contents/Info.plist`, and `plutil -lint` in both macOS workflow sources.
Reject `AI Installer.command` while continuing to assert arm64 runner checks,
`--ci`, checksum evidence, and no Intel build.

- [ ] **Step 4: Run workflow-focused tests**

Run:

```bash
node --test macos-build.test.js release-workflow.test.js
```

Expected: all workflow contract tests pass.

- [ ] **Step 5: Commit CI and release changes**

```bash
git add .github/workflows/package-macos-arm64.yml .github/workflows/release-all.yml macos-build.test.js
git commit -m "ci: validate macOS app bundle installer"
```

---

### Task 4: Update macOS documentation and run full verification

**Files:**
- Modify: `README.md`
- Modify: `docs/macos-installation.md`

**Interfaces:**
- Consumes: the final DMG entry point `AI Installer.app` and existing unsigned-artifact security policy.
- Produces: instructions that tell users to verify the DMG, open the app, and use Gatekeeper's per-app approval without claiming a security bypass.

- [ ] **Step 1: Replace command-file instructions with app instructions**

Use this flow in both documents:

```text
1. Download ai-installer-macos-arm64.dmg and SHA256SUMS.txt.
2. Verify the DMG with `shasum -a 256 ai-installer-macos-arm64.dmg`.
3. Double-click the DMG.
4. Double-click `AI Installer.app` in the mounted disk image.
5. The installer opens Terminal and runs the existing installation wizard.
```

Update troubleshooting examples from `AI Installer.command` to
`AI Installer.app`. State explicitly that the wrapper changes the Finder entry
point but does not bypass Gatekeeper; unsigned builds may still require Finder
`Open` or System Settings → Privacy & Security → Open Anyway.

- [ ] **Step 2: Scan documentation for stale command-file claims**

Run:

```bash
rg -n "AI Installer\.command|\.cmd" README.md docs/macos-installation.md
```

Expected: no user instructions refer to `AI Installer.command` or `.cmd`; any
remaining bare Mach-O mention must only warn users not to run it directly.

- [ ] **Step 3: Run the full test and syntax suite**

Run:

```bash
npm test
node --check install-all.js
node --check macos-installer.js
node --check platform-support.js
node --check software-manifest.js
node --check scripts/build-macos-dmg.js
git diff --check
```

Expected: all Node tests pass, all syntax checks exit 0, and `git diff --check`
produces no output.

- [ ] **Step 4: Review the final diff and commit documentation**

Run:

```bash
git diff --stat HEAD~3..HEAD
git status --short
```

Confirm only the intended build script, workflow files, tests, and documentation
changed. Then commit:

```bash
git add README.md docs/macos-installation.md
git commit -m "docs: explain macOS app bundle installation"
```

- [ ] **Step 5: Report the local build limitation when applicable**

If `npm run build:macos:arm64` cannot run because `process.platform !== 'darwin'`,
report that limitation and rely on the macOS GitHub Actions job for DMG-level
verification. Do not claim the DMG was locally built or opened without a
successful build command.
