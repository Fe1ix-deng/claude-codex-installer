'use strict';

const os = require('node:os');
const path = require('node:path');

const CC_SWITCH_INSTALL_PATH = path.win32.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'Programs',
  'CC Switch',
  'CC-Switch.exe',
);

const ARTIFACT_FIELDS = Object.freeze([
  'softwareId',
  'displayName',
  'platform',
  'arch',
  'binaryArchitecture',
  'url',
  'filename',
  'installerType',
  'sourceReleaseUrl',
  'checksumUrl',
  'sha256',
  'size',
  'downloadUrlTemplate',
  'checksumUrlTemplate',
  'releaseOwner',
  'releaseRepo',
  'releaseAssetPattern',
  'checksumAssetPattern',
  'executableName',
  'bundleId',
  'bundleExecutable',
  'appName',
  'installPath',
  'minimumSystemVersion',
]);

function createArtifact(values) {
  for (const field of Object.keys(values)) {
    if (!ARTIFACT_FIELDS.includes(field)) {
      const error = new Error(`unknown artifact field: ${field}`);
      error.code = 'ARTIFACT_FIELD_UNKNOWN';
      throw error;
    }
  }
  const normalized = {};
  for (const field of ARTIFACT_FIELDS) normalized[field] = values[field] ?? null;
  return Object.freeze(normalized);
}

function dynamicRelease(values) {
  return {
    url: null,
    filename: null,
    sourceReleaseUrl: null,
    checksumUrl: null,
    sha256: null,
    size: null,
    downloadUrlTemplate: null,
    checksumUrlTemplate: null,
    ...values,
  };
}

const SOFTWARE_MANIFEST = Object.freeze({
  schemaVersion: 1,
  software: Object.freeze([
    Object.freeze({
      id: 'cc-switch',
      displayName: 'CC Switch',
      autoInstall: true,
      installPath: CC_SWITCH_INSTALL_PATH,
      artifacts: Object.freeze([
        createArtifact({
          softwareId: 'cc-switch',
          displayName: 'CC Switch',
          platform: 'win32',
          arch: 'x64',
          binaryArchitecture: 'x64',
          ...dynamicRelease({
            releaseOwner: 'farion1231',
            releaseRepo: 'cc-switch',
            releaseAssetPattern: '^CC-Switch-[^/]+-Windows\\.msi$',
            checksumAssetPattern: null,
            installerType: 'msi',
            executableName: 'CC-Switch.exe',
            installPath: CC_SWITCH_INSTALL_PATH,
          }),
        }),
        createArtifact({
          softwareId: 'cc-switch',
          displayName: 'CC Switch',
          platform: 'win32',
          arch: 'arm64',
          binaryArchitecture: 'arm64',
          ...dynamicRelease({
            releaseOwner: 'farion1231',
            releaseRepo: 'cc-switch',
            releaseAssetPattern: '^CC-Switch-[^/]+-Windows-arm64\\.msi$',
            checksumAssetPattern: null,
            installerType: 'msi',
            executableName: 'CC-Switch.exe',
            installPath: CC_SWITCH_INSTALL_PATH,
          }),
        }),
        createArtifact({
          softwareId: 'cc-switch',
          displayName: 'CC Switch',
          platform: 'darwin',
          arch: 'arm64',
          binaryArchitecture: 'arm64',
          ...dynamicRelease({
            releaseOwner: 'farion1231',
            releaseRepo: 'cc-switch',
            releaseAssetPattern: '^CC-Switch-[^/]+-macOS\\.dmg$',
            checksumAssetPattern: null,
            installerType: 'dmg',
            executableName: 'cc-switch',
            bundleId: 'com.ccswitch.desktop',
            bundleExecutable: 'cc-switch',
            appName: 'CC Switch.app',
            installPath: '~/Applications/CC Switch.app',
            minimumSystemVersion: '12.0',
          }),
        }),
      ]),
    }),
    Object.freeze({
      id: 'claude',
      displayName: 'Claude Desktop',
      autoInstall: true,
      installPath: null,
      artifacts: Object.freeze([
        createArtifact({
          softwareId: 'claude',
          displayName: 'Claude Desktop',
          platform: 'win32',
          arch: 'x64',
          binaryArchitecture: 'x64',
          ...dynamicRelease({
            releaseOwner: 'Wangnov',
            releaseRepo: 'claude-app-mirror',
            releaseAssetPattern: '^Claude-win-x64\\.msix$',
            checksumAssetPattern: '^SHA256SUMS\\.txt$',
            downloadUrlTemplate: 'https://claudeapp.agentsmirror.com/latest/win-x64',
            checksumUrlTemplate: 'https://claudeapp.agentsmirror.com/latest/checksums',
            installerType: 'msix',
            executableName: 'Claude.exe',
          }),
        }),
        createArtifact({
          softwareId: 'claude',
          displayName: 'Claude Desktop',
          platform: 'win32',
          arch: 'arm64',
          binaryArchitecture: 'arm64',
          ...dynamicRelease({
            releaseOwner: 'Wangnov',
            releaseRepo: 'claude-app-mirror',
            releaseAssetPattern: '^Claude-win-arm64\\.msix$',
            checksumAssetPattern: '^SHA256SUMS\\.txt$',
            downloadUrlTemplate: 'https://claudeapp.agentsmirror.com/latest/win-arm64',
            checksumUrlTemplate: 'https://claudeapp.agentsmirror.com/latest/checksums',
            installerType: 'msix',
            executableName: 'Claude.exe',
          }),
        }),
        createArtifact({
          softwareId: 'claude',
          displayName: 'Claude Desktop',
          platform: 'darwin',
          arch: 'arm64',
          binaryArchitecture: 'universal',
          ...dynamicRelease({
            releaseOwner: 'Wangnov',
            releaseRepo: 'claude-app-mirror',
            releaseAssetPattern: '^Claude-mac-universal\\.dmg$',
            checksumAssetPattern: '^SHA256SUMS\\.txt$',
            downloadUrlTemplate: 'https://claudeapp.agentsmirror.com/latest/mac',
            checksumUrlTemplate: 'https://claudeapp.agentsmirror.com/latest/checksums',
            installerType: 'dmg',
            executableName: 'Claude',
            bundleId: 'com.anthropic.claudefordesktop',
            bundleExecutable: 'Claude',
            appName: 'Claude.app',
            installPath: '~/Applications/Claude.app',
            minimumSystemVersion: '12.0',
          }),
        }),
      ]),
    }),
    Object.freeze({
      id: 'codex',
      displayName: 'Codex',
      autoInstall: true,
      installPath: null,
      artifacts: Object.freeze([
        createArtifact({
          softwareId: 'codex',
          displayName: 'Codex',
          platform: 'win32',
          arch: 'x64',
          binaryArchitecture: 'x64',
          ...dynamicRelease({
            releaseOwner: 'Wangnov',
            releaseRepo: 'codex-app-mirror',
            releaseAssetPattern: '^OpenAI\\.Codex_.*_x64__2p2nqsd0c76g0\\.Msix$',
            checksumAssetPattern: '^SHA256SUMS-windows\\.txt$',
            downloadUrlTemplate: 'https://codexapp.agentsmirror.com/latest/win-x64',
            checksumUrlTemplate: 'https://codexapp.agentsmirror.com/latest/checksums',
            installerType: 'msix',
            executableName: 'app/ChatGPT.exe',
          }),
        }),
        createArtifact({
          softwareId: 'codex',
          displayName: 'Codex',
          platform: 'win32',
          arch: 'arm64',
          binaryArchitecture: 'arm64',
          ...dynamicRelease({
            releaseOwner: 'Wangnov',
            releaseRepo: 'codex-app-mirror',
            releaseAssetPattern: '^OpenAI\\.Codex_.*_arm64__2p2nqsd0c76g0\\.Msix$',
            checksumAssetPattern: '^SHA256SUMS-windows\\.txt$',
            downloadUrlTemplate: 'https://codexapp.agentsmirror.com/latest/win-arm64',
            checksumUrlTemplate: 'https://codexapp.agentsmirror.com/latest/checksums',
            installerType: 'msix',
            executableName: 'app/ChatGPT.exe',
          }),
        }),
        createArtifact({
          softwareId: 'codex',
          displayName: 'Codex',
          platform: 'darwin',
          arch: 'arm64',
          binaryArchitecture: 'arm64',
          ...dynamicRelease({
            releaseOwner: 'Wangnov',
            releaseRepo: 'codex-app-mirror',
            releaseAssetPattern: '^Codex-mac-arm64\\.dmg$',
            checksumAssetPattern: '^SHA256SUMS-macos\\.txt$',
            downloadUrlTemplate: 'https://codexapp.agentsmirror.com/latest/mac-arm64',
            checksumUrlTemplate: 'https://codexapp.agentsmirror.com/latest/checksums',
            installerType: 'dmg',
            executableName: 'ChatGPT',
            bundleId: 'com.openai.codex',
            bundleExecutable: 'ChatGPT',
            appName: 'ChatGPT.app',
            installPath: '~/Applications/ChatGPT.app',
            minimumSystemVersion: '13.0',
          }),
        }),
      ]),
    }),
  ]),
});

function getArtifact(softwareId, target) {
  if (!target) return null;
  const software = SOFTWARE_MANIFEST.software.find(({ id }) => id === softwareId);
  if (!software) return null;
  const match = software.artifacts.find(
    ({ platform, arch }) => platform === target.platform && arch === target.arch,
  );
  return match ? { ...match } : null;
}

function getReleaseSpec(softwareId, target) {
  const artifact = getArtifact(softwareId, target);
  if (!artifact) return null;
  return {
    owner: artifact.releaseOwner,
    repo: artifact.releaseRepo,
    assetPattern: new RegExp(artifact.releaseAssetPattern, 'i'),
    checksumAssetPattern: artifact.checksumAssetPattern
      ? new RegExp(artifact.checksumAssetPattern, 'i')
      : null,
  };
}

function getSoftwareConfigs() {
  return SOFTWARE_MANIFEST.software.map((software) => ({
    id: software.id,
    name: software.displayName,
    autoInstall: software.autoInstall,
    installPath: software.installPath,
  }));
}

module.exports = {
  ARTIFACT_FIELDS,
  CC_SWITCH_INSTALL_PATH,
  createArtifact,
  getArtifact,
  getReleaseSpec,
  getSoftwareConfigs,
  SOFTWARE_MANIFEST,
};
