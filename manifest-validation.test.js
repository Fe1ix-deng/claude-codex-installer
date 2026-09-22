'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { SOFTWARE_MANIFEST } = require('./software-manifest');
const { validateManifest } = require('./manifest-validation');

function cloneManifest() {
  const manifest = JSON.parse(JSON.stringify(SOFTWARE_MANIFEST));
  const artifact = manifest.software[0].artifacts[0];
  artifact.url = 'https://github.com/farion1231/cc-switch/releases/download/v3.20.3/CC-Switch-v3.20.3-Windows.msi';
  artifact.filename = 'CC-Switch-v3.20.3-Windows.msi';
  artifact.sourceReleaseUrl = 'https://github.com/farion1231/cc-switch/releases/tag/v3.20.3';
  artifact.checksumUrl = 'https://github.com/farion1231/cc-switch/releases/download/v3.20.3/SHA256SUMS.txt';
  artifact.sha256 = 'a'.repeat(64);
  artifact.size = 1;
  return manifest;
}

function firstArtifact(manifest = SOFTWARE_MANIFEST) {
  return manifest.software[0].artifacts[0];
}

function errorCodes(manifest) {
  return validateManifest(manifest).errors.map((error) => error.code);
}

test('checked-in manifest is complete and valid', () => {
  assert.deepEqual(validateManifest(SOFTWARE_MANIFEST), { valid: true, errors: [] });
});

test('dynamic Release entries require GitHub repository and asset matching metadata', () => {
  for (const software of SOFTWARE_MANIFEST.software) {
    for (const artifact of software.artifacts) {
      assert.equal(typeof artifact.releaseOwner, 'string');
      assert.equal(typeof artifact.releaseRepo, 'string');
      assert.equal(typeof artifact.releaseAssetPattern, 'string');
      assert.equal(artifact.url, null);
      assert.equal(artifact.filename, null);
      assert.equal(artifact.sourceReleaseUrl, null);
      assert.equal(artifact.sha256, null);
      assert.equal(artifact.size, null);
    }
  }
});

test('fixed SHA-256 is required even when checksumUrl is present', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).sha256 = null;
  assert.ok(errorCodes(manifest).includes('CHECKSUM_MISSING'));
});

test('missing or empty fixed SHA-256 fails validation', () => {
  const missing = cloneManifest();
  delete firstArtifact(missing).sha256;
  assert.ok(errorCodes(missing).includes('ARTIFACT_FIELD_MISSING'));
  assert.ok(errorCodes(missing).includes('CHECKSUM_MISSING'));

  const empty = cloneManifest();
  firstArtifact(empty).sha256 = '';
  assert.ok(errorCodes(empty).includes('CHECKSUM_MISSING'));
});

test('latest download or source Release URLs fail validation', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).url = 'https://github.com/farion1231/cc-switch/releases/latest/download/CC-Switch-v3.20.3-Windows.msi';
  assert.ok(errorCodes(manifest).includes('LATEST_URL_FORBIDDEN'));
});

test('artifact URL must be a fixed GitHub Release asset without query parameters', () => {
  const nonRelease = cloneManifest();
  firstArtifact(nonRelease).url = 'https://github.com/farion1231/cc-switch/raw/main/CC-Switch-v3.20.3-Windows.msi';
  assert.ok(errorCodes(nonRelease).includes('RELEASE_ASSET_URL_INVALID'));

  const query = cloneManifest();
  firstArtifact(query).url += '?filename=CC-Switch-v3.20.3-Windows.msi';
  assert.ok(errorCodes(query).includes('URL_QUERY_FORBIDDEN'));
});

test('source Release owner and repository must match the download URL', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).sourceReleaseUrl = 'https://github.com/other-owner/other-repo/releases/tag/v3.20.3';
  assert.ok(errorCodes(manifest).includes('RELEASE_SOURCE_MISMATCH'));
});

test('source Release tag must match the download URL', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).sourceReleaseUrl = 'https://github.com/farion1231/cc-switch/releases/tag/v3.20.2';
  assert.ok(errorCodes(manifest).includes('RELEASE_SOURCE_MISMATCH'));
});

test('decoded Release asset filename must match filename exactly', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).url = 'https://github.com/farion1231/cc-switch/releases/download/v3.20.3/other.msi';
  assert.ok(errorCodes(manifest).includes('ARTIFACT_FILENAME_MISMATCH'));
});

test('checksumUrl must use the same GitHub repository and tag as the artifact', () => {
  const otherRepo = cloneManifest();
  firstArtifact(otherRepo).checksumUrl = 'https://github.com/other/repo/releases/download/v3.20.3/SHA256SUMS.txt';
  assert.ok(errorCodes(otherRepo).includes('CHECKSUM_SOURCE_MISMATCH'));

  const otherTag = cloneManifest();
  firstArtifact(otherTag).checksumUrl = 'https://github.com/farion1231/cc-switch/releases/download/v3.20.2/SHA256SUMS.txt';
  assert.ok(errorCodes(otherTag).includes('CHECKSUM_SOURCE_MISMATCH'));
});

test('invalid SHA-256 fails validation', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).sha256 = 'not-a-sha256';
  assert.ok(errorCodes(manifest).includes('SHA256_INVALID'));
});

test('installer type and filename extension mismatch fails validation', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).installerType = 'msix';
  assert.ok(errorCodes(manifest).includes('INSTALLER_EXTENSION_MISMATCH'));
});

test('duplicate platform and architecture artifact fails validation', () => {
  const manifest = cloneManifest();
  manifest.software[0].artifacts.push({ ...manifest.software[0].artifacts[0] });
  assert.ok(errorCodes(manifest).includes('ARTIFACT_DUPLICATE'));
});

test('duplicate software IDs fail validation', () => {
  const manifest = cloneManifest();
  manifest.software.push({ ...manifest.software[0], artifacts: [] });
  assert.ok(errorCodes(manifest).includes('SOFTWARE_ID_DUPLICATE'));
});

test('software entries require every schema field', () => {
  for (const field of ['autoInstall', 'installPath']) {
    const manifest = cloneManifest();
    delete manifest.software[0][field];
    assert.ok(errorCodes(manifest).includes('SOFTWARE_FIELD_MISSING'), field);
  }
});

test('software autoInstall must be boolean and installPath must be a string or null', () => {
  const manifest = cloneManifest();
  manifest.software[0].autoInstall = 'true';
  manifest.software[0].installPath = 0;
  const codes = errorCodes(manifest);
  assert.ok(codes.includes('SOFTWARE_AUTO_INSTALL_INVALID'));
  assert.ok(codes.includes('SOFTWARE_INSTALL_PATH_INVALID'));
});

test('unexpected artifact fields fail validation', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).legacyDownloadPattern = '*.msi';
  assert.ok(errorCodes(manifest).includes('ARTIFACT_FIELD_UNKNOWN'));
});

test('unexpected manifest fields fail validation', () => {
  const manifest = cloneManifest();
  manifest.legacyCatalog = [];
  assert.ok(errorCodes(manifest).includes('MANIFEST_FIELD_UNKNOWN'));
});

test('unsupported manifest schema versions fail validation', () => {
  const manifest = cloneManifest();
  manifest.schemaVersion = 2;
  assert.ok(errorCodes(manifest).includes('SCHEMA_VERSION_UNSUPPORTED'));
});

test('macOS artifact identity fields are mandatory', () => {
  const manifest = cloneManifest();
  const macArtifact = manifest.software[0].artifacts.find(({ platform }) => platform === 'darwin');
  macArtifact.bundleId = null;
  macArtifact.bundleExecutable = null;
  macArtifact.appName = null;
  const codes = errorCodes(manifest);
  assert.ok(codes.includes('MACOS_BUNDLE_ID_MISSING'));
  assert.ok(codes.includes('MACOS_EXECUTABLE_MISSING'));
  assert.ok(codes.includes('MACOS_APP_NAME_MISSING'));
});

test('unsupported Windows x86 and macOS Intel entries fail validation', () => {
  const manifest = cloneManifest();
  manifest.software[0].artifacts[0].arch = 'x86';
  manifest.software[1].artifacts.find(({ platform }) => platform === 'darwin').arch = 'x64';
  const codes = errorCodes(manifest);
  assert.ok(codes.includes('TARGET_UNSUPPORTED'));
  assert.ok(codes.includes('EXPECTED_ARTIFACT_MISSING'));
});

test('binaryArchitecture must agree with platform and target architecture', () => {
  const manifest = cloneManifest();
  const windowsX64 = manifest.software[0].artifacts.find(
    ({ platform, arch }) => platform === 'win32' && arch === 'x64',
  );
  windowsX64.binaryArchitecture = 'arm64';
  assert.ok(errorCodes(manifest).includes('BINARY_ARCHITECTURE_MISMATCH'));
});

test('required artifact fields must use non-empty string types', () => {
  const manifest = cloneManifest();
  const entry = firstArtifact(manifest);
  entry.filename = 1;
  entry.installerType = '';
  entry.platform = null;
  entry.arch = false;
  entry.binaryArchitecture = [];
  entry.executableName = '   ';
  assert.ok(errorCodes(manifest).includes('ARTIFACT_FIELD_TYPE_INVALID'));
});

test('non-HTTPS URLs and non-positive sizes fail validation', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).url = 'http://example.com/app.msi';
  firstArtifact(manifest).size = 0;
  const codes = errorCodes(manifest);
  assert.ok(codes.includes('URL_HTTPS_REQUIRED'));
  assert.ok(codes.includes('SIZE_INVALID'));
});

test('missing fixed size fails validation', () => {
  const manifest = cloneManifest();
  firstArtifact(manifest).size = null;
  assert.ok(errorCodes(manifest).includes('SIZE_INVALID'));
});
