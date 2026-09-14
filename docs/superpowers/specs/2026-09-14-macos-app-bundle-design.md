# macOS App Bundle Installer Design

## Goal

Replace the current Finder entry point inside the macOS DMG with a standard
`AI Installer.app` bundle. Users should double-click the `.app`, see the
existing terminal-based installation wizard, and no longer need to open a
`.command` file or a bare Mach-O executable.

This changes the distribution wrapper only. The existing Node installer,
download manifests, checksum validation, per-user application installation,
and Windows artifacts remain unchanged.

## Constraints

- The supported build target remains macOS Apple Silicon (`darwin/arm64`).
- The DMG remains unsigned and unnotarized until a separate signing effort is
  completed. App packaging cannot remove Gatekeeper requirements.
- The installer must not disable Gatekeeper or SIP, remove quarantine
  attributes, use `sudo`, or force-quit applications.
- The public macOS artifact remains a DMG, but its user-facing contents must be
  `AI Installer.app` rather than `AI Installer.command`.

## Package Shape

The build script will create this structure in the temporary DMG source tree:

```text
AI Installer.app/
  Contents/
    Info.plist
    MacOS/
      AI Installer
      ai-installer-macos-arm64
```

`ai-installer-macos-arm64` is the existing `pkg`-generated executable. The
`AI Installer` executable is a small POSIX launcher that invokes
`/usr/bin/open -a Terminal` with an AppleScript command. The AppleScript runs
the bundled executable with the original arguments, keeps the Terminal window
open after completion, and quotes paths/arguments safely.

The bundle metadata will use a project-owned identifier such as
`com.fe1ix.ai-installer`, a human-readable display name, version `1.0.0`, and
minimum system version `12.0`. The launcher remains executable and the bundled
Node binary remains arm64.

## Runtime Flow

1. Finder launches `AI Installer.app` through `Contents/MacOS/AI Installer`.
2. The launcher resolves its own bundle path, locates the bundled packaged
   executable, and asks Terminal to run it.
3. Terminal executes the packaged installer with all original arguments,
   including `--ci` and `--print-target` used by CI validation.
4. The packaged installer retains its current CLI behavior and exit code.

The launcher must fail with a readable message if the bundled executable is
missing or Terminal cannot be opened. It must not silently fall back to a
different file or execute from the working directory.

## Build and CI Changes

- Replace the `.command` launcher and hidden top-level Mach-O layout with the
  `.app` bundle described above.
- Keep the output name `dist/ai-installer-macos-arm64.dmg` for release
  compatibility.
- Update CI to inspect `AI Installer.app/Contents/Info.plist`, verify the app
  launcher and bundled executable, and invoke the app's launcher with the
  existing target and `--ci` checks.
- Add static validation that the DMG contains the `.app` entry point and does
  not contain the old `.command` entry point.
- Update release verification and public documentation to describe opening the
  `.app`.

## Error Handling and Security

- The app wrapper does not claim to bypass Gatekeeper. Documentation will tell
  users to verify SHA-256 first, then use Finder `Open` or System Settings →
  Privacy & Security → Open Anyway when macOS blocks the unsigned app.
- The launcher uses absolute system paths for `open` and `osascript` and passes
  user arguments through AppleScript's argument list rather than concatenating
  an unescaped shell command.
- Existing installer safety behavior is preserved: checksum failures stop
  before mounting, existing applications are not overwritten, running apps
  produce `blocked`, and cleanup is attempted after failures.

## Testing Strategy

- Add a build-script test for the generated bundle layout, `Info.plist`
  metadata, launcher path, and removal of the old `.command` layout.
- Update workflow tests to require `.app` paths and reject `.command` paths.
- Keep all existing installer unit tests unchanged unless a fixture needs a
  path update.
- Run the complete Node test suite and syntax checks.
- On macOS CI, mount the DMG read-only, inspect the bundle, invoke the app's
  launcher for `--print-target`, and run the existing CI installation check.

## Out of Scope

- Apple Developer signing, notarization, stapling, or automatic Gatekeeper
  approval.
- Converting the terminal wizard into a native Cocoa GUI.
- Changing the Windows packaging or release asset names.
