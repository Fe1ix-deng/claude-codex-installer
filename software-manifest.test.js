'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  ARTIFACT_FIELDS,
  createArtifact,
  getArtifact,
  getReleaseSpec,
  getSoftwareConfigs,
  SOFTWARE_MANIFEST,
} = require('./software-manifest');

const SOFTWARE_IDS = ['cc-switch', 'claude', 'codex'];
const TARGETS = [
  { platform: 'win32', arch: 'x64' },
  { platform: 'win32', arch: 'arm64' },
  { platform: 'darwin', arch: 'arm64' },
];

test('manifest provides every supported software/platform/architecture artifact', () => {
  for (const softwareId of SOFTWARE_IDS) {
    for (const target of TARGETS) {
      const artifact = getArtifact(softwareId, target);
      assert.ok(artifact, `${softwareId} ${target.platform}/${target.arch}`);
      assert.equal(artifact.softwareId, softwareId);
      assert.equal(artifact.platform, target.platform);
      assert.equal(artifact.arch, target.arch);
    }
  }
});

test('getArtifact returns a normalized schema and a defensive copy', () => {
  const artifact = getArtifact('claude', { platform: 'win32', arch: 'x64' });
  assert.deepEqual(Object.keys(artifact).sort(), [...ARTIFACT_FIELDS].sort());
  assert.equal(artifact.url, null);
  assert.equal(artifact.filename, null);
  assert.equal(artifact.installerType, 'msix');
  assert.equal(artifact.size, null);
  assert.equal(artifact.sha256, null);
  assert.equal(artifact.sourceReleaseUrl, null);
  assert.equal(artifact.releaseOwner, 'Wangnov');
  assert.equal(artifact.releaseRepo, 'claude-app-mirror');
  assert.match(artifact.releaseAssetPattern, /Claude-win-x64/);

  artifact.url = 'https://example.invalid/changed';
  assert.notEqual(getArtifact('claude', { platform: 'win32', arch: 'x64' }).url, artifact.url);
});

test('Claude and Codex release specs point to the verified GitHub repositories', () => {
  assert.deepEqual(getReleaseSpec('claude', { platform: 'win32', arch: 'x64' }), {
    owner: 'Wangnov',
    repo: 'claude-app-mirror',
    assetPattern: /^Claude-win-x64\.msix$/i,
    checksumAssetPattern: /^SHA256SUMS\.txt$/i,
  });
  assert.deepEqual(getReleaseSpec('codex', { platform: 'darwin', arch: 'arm64' }), {
    owner: 'Wangnov',
    repo: 'codex-app-mirror',
    assetPattern: /^Codex-mac-arm64\.dmg$/i,
    checksumAssetPattern: /^SHA256SUMS-macos\.txt$/i,
  });
});

test('Windows and macOS artifacts retain the upstream R2 CDN short links', () => {
  assert.equal(
    getArtifact('claude', { platform: 'win32', arch: 'x64' }).downloadUrlTemplate,
    'https://claudeapp.agentsmirror.com/latest/win-x64',
  );
  assert.equal(
    getArtifact('claude', { platform: 'win32', arch: 'arm64' }).downloadUrlTemplate,
    'https://claudeapp.agentsmirror.com/latest/win-arm64',
  );
  assert.equal(
    getArtifact('codex', { platform: 'win32', arch: 'x64' }).downloadUrlTemplate,
    'https://codexapp.agentsmirror.com/latest/win-x64',
  );
  assert.equal(
    getArtifact('codex', { platform: 'win32', arch: 'arm64' }).downloadUrlTemplate,
    'https://codexapp.agentsmirror.com/latest/win-arm64',
  );
  assert.equal(
    getArtifact('claude', { platform: 'darwin', arch: 'arm64' }).downloadUrlTemplate,
    'https://claudeapp.agentsmirror.com/latest/mac',
  );
  assert.equal(
    getArtifact('codex', { platform: 'darwin', arch: 'arm64' }).downloadUrlTemplate,
    'https://codexapp.agentsmirror.com/latest/mac-arm64',
  );
});

test('artifact construction rejects unknown or misspelled fields before normalization', () => {
  assert.throws(
    () => createArtifact({ softwareId: 'test', sh256: 'a'.repeat(64) }),
    (error) => error.code === 'ARTIFACT_FIELD_UNKNOWN' && /sh256/.test(error.message),
  );
  assert.throws(
    () => createArtifact({ softwareId: 'test', minimumSytemVersion: '13.0' }),
    (error) => error.code === 'ARTIFACT_FIELD_UNKNOWN' && /minimumSytemVersion/.test(error.message),
  );
});

test('Windows artifacts declare dynamic Release resolution without versioned URLs', () => {
  for (const softwareId of SOFTWARE_IDS) {
    for (const arch of ['x64', 'arm64']) {
      const artifact = getArtifact(softwareId, { platform: 'win32', arch });
      assert.equal(artifact.url, null);
      assert.equal(artifact.filename, null);
      assert.equal(artifact.size, null);
      assert.equal(artifact.sha256, null);
      assert.equal(typeof artifact.releaseAssetPattern, 'string');
      assert.equal(artifact.releaseOwner, softwareId === 'cc-switch' ? 'farion1231' : 'Wangnov');
    }
  }
});

test('macOS artifacts retain audited bundle identity and arm64 compatibility metadata', () => {
  for (const softwareId of SOFTWARE_IDS) {
    const artifact = getArtifact(softwareId, { platform: 'darwin', arch: 'arm64' });
    assert.equal(artifact.installerType, 'dmg');
    assert.match(artifact.appName, /\.app$/);
    assert.ok(artifact.bundleId);
    assert.ok(artifact.bundleExecutable);
    assert.equal(artifact.url, null);
    assert.equal(artifact.sha256, null);
    assert.equal(artifact.size, null);
    assert.equal(typeof artifact.releaseAssetPattern, 'string');
    assert.ok(['arm64', 'universal'].includes(artifact.binaryArchitecture));
  }
  assert.equal(getArtifact('codex', { platform: 'darwin', arch: 'arm64' }).bundleExecutable, 'ChatGPT');
});

test('software configs are derived from the manifest catalog', () => {
  assert.deepEqual(getSoftwareConfigs().map(({ id, name, autoInstall }) => ({ id, name, autoInstall })), [
    { id: 'cc-switch', name: 'CC Switch', autoInstall: true },
    { id: 'claude', name: 'Claude Desktop', autoInstall: true },
    { id: 'codex', name: 'Codex', autoInstall: true },
  ]);
  assert.equal(SOFTWARE_MANIFEST.software.length, 3);
});

test('unsupported platform, Windows x86, and macOS Intel return no artifact', () => {
  assert.equal(getArtifact('cc-switch', { platform: 'win32', arch: 'x86' }), null);
  assert.equal(getArtifact('claude', { platform: 'darwin', arch: 'x64' }), null);
  assert.equal(getArtifact('codex', { platform: 'linux', arch: 'x64' }), null);
  assert.equal(getArtifact('unknown', { platform: 'win32', arch: 'x64' }), null);
});
