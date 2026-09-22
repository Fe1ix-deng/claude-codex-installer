# Repository Unification and Manifest Governance Report

Date: 2026-09-16

## Decision

The sole source of truth remains the nested Git repository:

```text
/Users/apple/Desktop/所有AI相关/Vibe coding project/一键安装ccs+codex+cc/win-verify-macos-arm64
```

Promoting `.git` to the outer directory was rejected because the outer directory was not a repository, contained a stale source copy and generated files, and moving repository metadata would add risk without improving history preservation. Keeping the repository in place preserves every branch, tag, remote, tracked artifact, and commit identity.

## Git State Before Migration

- Branch: `fix/release-asset-allowlist`
- Upstream: `origin/fix/release-asset-allowlist`
- Remote: `git@github.com:Fe1ix-deng/claude-codex-installer.git`
- HEAD before task changes: `feb75c7 docs: clarify release download and configuration flow`
- Local status before task changes: clean
- Local branches: `main`, `feature/macos-arm64-experimental`, `fix/release-asset-allowlist`
- Tags: `v0.1.0`, `v0.2.0-macos-arm64-experimental.1` through `.5`, and `v1.0.0`
- Baseline tests: 114 passed

No user-authored uncommitted change existed before this task. Ignored local content inside the repository included `node_modules/` and `dist/ai-installer-macos-arm64.dmg`; neither is copied into source.

## Outer Directory Before Migration

The outer non-Git directory contained the following duplicate or legacy project entries:

```text
.DS_Store
README.md
checksum.js
checksum.test.js
dist/
docs/
install-all.js
install-all.test.js
install-cc-switch.js
install-cc-switch.test.js
package-lock.json
package.json
platform-support.js
platform-support.test.js
scripts/
software-manifest.js
software-manifest.test.js
初步沟通文档/
```

The nested repository additionally contained macOS implementation, CI workflows, combined Release workflows, packaging scripts, documentation tests, release allowlist tests, and newer source/tests. Therefore the outer copy was not suitable as the source of truth.

## Migration Operation

All outer entries except `win-verify-macos-arm64/` are moved, without deletion, to:

```text
/private/tmp/claude-codex-installer-legacy-outer-2026-09-16
```

The outer directory retains only:

```text
README.md
win-verify-macos-arm64/
```

The new outer `README.md` is a pointer to the sole repository and contains no executable source.

## Manifest Governance

- Three software IDs and nine supported artifacts are represented in one catalog.
- Supported targets are Windows x64, Windows ARM64, and macOS arm64 only.
- Windows artifact metadata was verified on 2026-09-16 against fixed GitHub Release assets for CC Switch `v3.20.3`, Claude `2.110.0`, and Codex Release `26.908.70816` / MSIX `26.908.9136.0`.
- Existing audited macOS artifacts remain pinned to their previously validated releases and bundle metadata.
- Every formal artifact has a fixed URL, filename, installer type, source Release URL, positive size, and fixed SHA-256.
- Artifact URLs are fixed GitHub Release assets whose owner, repository, tag, and decoded filename are checked against the source Release metadata. Optional checksum URLs must identify the same repository and tag.
- Fixed manifest SHA-256 values are the only runtime integrity trust root; checksum URLs remain audit metadata and are not fetched as a fallback.
- macOS entries additionally include App name, Bundle ID, bundle executable, arm64 compatibility, install path, and minimum system version.
- `manifest-validation.js` blocks dynamic upstream `latest` URLs, Release provenance mismatches, architecture conflicts, unsupported targets, duplicates, unknown or missing fields, fixed SHA-256 gaps, invalid sizes/hashes, and incomplete macOS identity.
- `install-all.js` validates size and SHA-256 before MSI, MSIX, or DMG installation and removes failed cache files.
- `install-cc-switch.js` is now only a compatibility wrapper over the unified installer and manifest.

## Required Commands

Run all commands from the sole repository root:

```bash
npm test
npm run validate:manifest
node --check install-all.js
node --check software-manifest.js
node --check platform-support.js
node --check checksum.js
```

## Final State

The outer directory now contains exactly these project entries:

```text
README.md
win-verify-macos-arm64/
```

The legacy outer source remains recoverable at:

```text
/private/tmp/claude-codex-installer-legacy-outer-2026-09-16
```

Repository identity after the migration is unchanged:

- Branch: `fix/release-asset-allowlist`
- Upstream: `origin/fix/release-asset-allowlist`
- Remote: `git@github.com:Fe1ix-deng/claude-codex-installer.git`
- HEAD: `feb75c7 docs: clarify release download and configuration flow`
- Tags: seven tags from `v0.1.0` through `v1.0.0`
- Commit created by this task: none

New source-controlled files created by this task are:

```text
docs/repository-unification-report.md
docs/superpowers/plans/2026-09-16-repository-manifest-governance.md
manifest-validation.js
manifest-validation.test.js
```

The final working tree intentionally contains the implementation, test, workflow, and documentation changes from this task. No pre-existing user change was overwritten, and ignored `node_modules/`, `dist/`, and temporary files remain outside the source changes.

## Final Verification

- `npm test`: 132 passed, 0 failed
- `npm run validate:manifest`: 3 software entries and 9 artifacts valid
- Required `node --check` commands: passed
- `git diff --check`: passed

## Manifest Governance Follow-up

Date: 2026-09-17

The schema version 1 gate now requires a valid fixed SHA-256 for every artifact even when a checksum URL is present. It also validates software and artifact field types, platform/binary architecture consistency, exact GitHub Release asset structure, source Release relationships, decoded filenames, and optional checksum provenance. Artifact construction rejects unknown fields before normalization so misspellings cannot be silently discarded.

Follow-up verification completed with 132 tests passing, all manifest and syntax checks passing, and no diff whitespace errors. The optional local macOS arm64 build reached the `hdiutil create` step after using a writable temporary `pkg` cache, but the restricted execution environment returned `设备未配置`; no successful DMG build is claimed from this run.
