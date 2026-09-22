# Repository and Manifest Governance Implementation Plan

**Goal:** Make `win-verify-macos-arm64` the only maintained Git project root and move every supported installer artifact to one validated manifest with mandatory integrity checks.

**Architecture:** Keep the existing installer and platform modules, replace scattered artifact metadata with a strict manifest catalog, and add a standalone validation gate used by tests and CI. Preserve current Windows MSI/MSIX and macOS DMG behavior while applying the same size and SHA-256 pre-install checks on every platform.

## Tasks

1. Record the outer-copy versus nested-repository inventory, Git refs, remote, tags, and clean status.
2. Add failing tests for the strict artifact schema, target completeness, fixed URLs, checksum requirements, and duplicate detection.
3. Implement the manifest catalog, normalized `getArtifact()`, derived software configs, and `manifest-validation.js` CLI.
4. Make `install-all.js` reject incomplete integrity metadata before download and verify size plus SHA-256 for Windows and macOS.
5. Add `npm run validate:manifest` to every build and release workflow before packaging or publication.
6. Document the sole project root, upstream provenance, build/test/release commands, and the retirement of the outer legacy copy.
7. Remove the verified outer legacy source copy and generated clutter without changing nested Git history, refs, tags, remote, or ignored local dependencies.
8. Run the complete test suite, manifest validator, required syntax checks, and final Git/inventory audit.
