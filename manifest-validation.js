'use strict';

const { ARTIFACT_FIELDS, SOFTWARE_MANIFEST } = require('./software-manifest');

const MANIFEST_FIELDS = Object.freeze(['schemaVersion', 'software']);
const SOFTWARE_FIELDS = Object.freeze(['id', 'displayName', 'autoInstall', 'installPath', 'artifacts']);
const EXPECTED_TARGETS = Object.freeze([
  ['win32', 'x64'],
  ['win32', 'arm64'],
  ['darwin', 'arm64'],
]);
const EXTENSIONS = Object.freeze({ msi: '.msi', msix: '.msix', dmg: '.dmg' });
const REQUIRED_ARTIFACT_STRINGS = Object.freeze([
  'softwareId',
  'displayName',
  'platform',
  'arch',
  'binaryArchitecture',
  'installerType',
  'executableName',
  'releaseOwner',
  'releaseRepo',
  'releaseAssetPattern',
]);
const NULLABLE_ARTIFACT_STRINGS = Object.freeze([
  'url',
  'filename',
  'sourceReleaseUrl',
  'checksumUrl',
  'sha256',
  'bundleId',
  'bundleExecutable',
  'appName',
  'installPath',
  'minimumSystemVersion',
  'downloadUrlTemplate',
  'checksumUrlTemplate',
]);

const RELEASE_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttps(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function usesLatest(value) {
  if (typeof value !== 'string') return false;
  try {
    return /\/latest(?:\/|$)/i.test(new URL(value).pathname);
  } catch {
    return /\/latest(?:\/|$)/i.test(value);
  }
}

function parseGithubReleaseAsset(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password) return null;
    if (url.search || url.hash) return null;
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/([^/]+)$/);
    if (!match) return null;
    const [, owner, repo, tag, filename] = match.map((segment) => decodeURIComponent(segment));
    if (![owner, repo, tag, filename].every(isNonEmptyString)) return null;
    return { owner, repo, tag, filename };
  } catch {
    return null;
  }
}

function parseGithubReleasePage(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password) return null;
    if (url.search || url.hash) return null;
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/tag\/([^/]+)$/);
    if (!match) return null;
    const [, owner, repo, tag] = match.map((segment) => decodeURIComponent(segment));
    if (![owner, repo, tag].every(isNonEmptyString)) return null;
    return { owner, repo, tag };
  } catch {
    return null;
  }
}

function sameRelease(left, right) {
  return left && right
    && left.owner === right.owner
    && left.repo === right.repo
    && left.tag === right.tag;
}

function validateManifest(manifest) {
  const errors = [];
  const add = (code, path, message) => errors.push({ code, path, message });
  if (!manifest || !Array.isArray(manifest.software)) {
    add('MANIFEST_FORMAT_INVALID', 'manifest.software', 'software must be an array');
    return { valid: false, errors };
  }
  for (const key of Object.keys(manifest)) {
    if (!MANIFEST_FIELDS.includes(key)) add('MANIFEST_FIELD_UNKNOWN', `manifest.${key}`, `unknown field: ${key}`);
  }
  if (manifest.schemaVersion !== 1) {
    add('SCHEMA_VERSION_UNSUPPORTED', 'manifest.schemaVersion', 'schemaVersion must be 1');
  }

  const softwareIds = new Set();
  manifest.software.forEach((software, softwareIndex) => {
    const softwarePath = `software[${softwareIndex}]`;
    if (!software || typeof software !== 'object') {
      add('SOFTWARE_FORMAT_INVALID', softwarePath, 'software entry must be an object');
      return;
    }
    for (const key of Object.keys(software)) {
      if (!SOFTWARE_FIELDS.includes(key)) add('SOFTWARE_FIELD_UNKNOWN', `${softwarePath}.${key}`, `unknown field: ${key}`);
    }
    for (const field of SOFTWARE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(software, field)) {
        add('SOFTWARE_FIELD_MISSING', `${softwarePath}.${field}`, `missing field: ${field}`);
      }
    }
    if (!isNonEmptyString(software.id)) {
      add('SOFTWARE_ID_INVALID', `${softwarePath}.id`, 'software id is required');
    } else if (softwareIds.has(software.id)) {
      add('SOFTWARE_ID_DUPLICATE', `${softwarePath}.id`, `duplicate software id: ${software.id}`);
    } else {
      softwareIds.add(software.id);
    }
    if (!isNonEmptyString(software.displayName)) {
      add('DISPLAY_NAME_INVALID', `${softwarePath}.displayName`, 'display name is required');
    }
    if (typeof software.autoInstall !== 'boolean') {
      add('SOFTWARE_AUTO_INSTALL_INVALID', `${softwarePath}.autoInstall`, 'autoInstall must be boolean');
    }
    if (software.installPath !== null && !isNonEmptyString(software.installPath)) {
      add('SOFTWARE_INSTALL_PATH_INVALID', `${softwarePath}.installPath`, 'installPath must be a non-empty string or null');
    }
    if (!Array.isArray(software.artifacts)) {
      add('ARTIFACTS_FORMAT_INVALID', `${softwarePath}.artifacts`, 'artifacts must be an array');
      return;
    }

    const targetKeys = new Set();
    software.artifacts.forEach((entry, artifactIndex) => {
      const artifactPath = `${softwarePath}.artifacts[${artifactIndex}]`;
      if (!entry || typeof entry !== 'object') {
        add('ARTIFACT_FORMAT_INVALID', artifactPath, 'artifact must be an object');
        return;
      }
      for (const key of Object.keys(entry)) {
        if (!ARTIFACT_FIELDS.includes(key)) add('ARTIFACT_FIELD_UNKNOWN', `${artifactPath}.${key}`, `unknown field: ${key}`);
      }
      for (const field of ARTIFACT_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(entry, field)) {
          add('ARTIFACT_FIELD_MISSING', `${artifactPath}.${field}`, `missing field: ${field}`);
        }
      }
      for (const field of REQUIRED_ARTIFACT_STRINGS) {
        if (!isNonEmptyString(entry[field])) {
          add('ARTIFACT_FIELD_TYPE_INVALID', `${artifactPath}.${field}`, `${field} must be a non-empty string`);
        }
      }
      for (const field of NULLABLE_ARTIFACT_STRINGS) {
        if (entry[field] !== null && !isNonEmptyString(entry[field])) {
          add('ARTIFACT_FIELD_TYPE_INVALID', `${artifactPath}.${field}`, `${field} must be a non-empty string or null`);
        }
      }
      for (const field of ['downloadUrlTemplate', 'checksumUrlTemplate']) {
        if (entry[field] !== null && !isHttps(entry[field])) {
          add('URL_HTTPS_REQUIRED', `${artifactPath}.${field}`, `${field} must use HTTPS`);
        }
      }
      if (entry.softwareId !== software.id) {
        add('ARTIFACT_SOFTWARE_MISMATCH', `${artifactPath}.softwareId`, 'artifact softwareId must match its parent');
      }
      if (entry.displayName !== software.displayName) {
        add('ARTIFACT_DISPLAY_NAME_MISMATCH', `${artifactPath}.displayName`, 'artifact displayName must match its parent');
      }

      if (!RELEASE_NAME_PATTERN.test(entry.releaseOwner || '') || !RELEASE_NAME_PATTERN.test(entry.releaseRepo || '')) {
        add('RELEASE_REPOSITORY_INVALID', artifactPath, 'releaseOwner and releaseRepo must be safe GitHub path segments');
      }
      let releaseAssetPattern = null;
      try {
        releaseAssetPattern = new RegExp(entry.releaseAssetPattern, 'i');
      } catch {
        add('RELEASE_ASSET_PATTERN_INVALID', `${artifactPath}.releaseAssetPattern`, 'releaseAssetPattern must be a valid regular expression');
      }
      if (entry.checksumAssetPattern !== null) {
        try {
          new RegExp(entry.checksumAssetPattern, 'i');
        } catch {
          add('CHECKSUM_ASSET_PATTERN_INVALID', `${artifactPath}.checksumAssetPattern`, 'checksumAssetPattern must be a valid regular expression or null');
        }
      }

      const targetKey = `${entry.platform}/${entry.arch}`;
      if (targetKeys.has(targetKey)) add('ARTIFACT_DUPLICATE', artifactPath, `duplicate target: ${targetKey}`);
      targetKeys.add(targetKey);
      const targetSupported = EXPECTED_TARGETS.some(([platform, arch]) => platform === entry.platform && arch === entry.arch);
      if (!targetSupported) add('TARGET_UNSUPPORTED', artifactPath, `unsupported target: ${targetKey}`);

      for (const field of ['url', 'sourceReleaseUrl', 'checksumUrl']) {
        const value = entry[field];
        if (value !== null && !isHttps(value)) add('URL_HTTPS_REQUIRED', `${artifactPath}.${field}`, `${field} must use HTTPS`);
        if (value !== null && usesLatest(value)) add('LATEST_URL_FORBIDDEN', `${artifactPath}.${field}`, `${field} must not use latest`);
        if (typeof value === 'string') {
          try {
            const parsed = new URL(value);
            if (parsed.search || parsed.hash) {
              add('URL_QUERY_FORBIDDEN', `${artifactPath}.${field}`, `${field} must not use query parameters or fragments`);
            }
          } catch {
            // URL_HTTPS_REQUIRED reports malformed values.
          }
        }
      }

      const dynamic = entry.url === null && entry.filename === null && entry.sourceReleaseUrl === null
        && entry.checksumUrl === null && entry.sha256 === null && entry.size === null;
      const releaseAsset = parseGithubReleaseAsset(entry.url);
      const releasePage = parseGithubReleasePage(entry.sourceReleaseUrl);
      if (!dynamic) {
        if (!releaseAsset) add('RELEASE_ASSET_URL_INVALID', `${artifactPath}.url`, 'url must be a fixed GitHub Release asset URL');
        if (!releasePage) add('SOURCE_RELEASE_URL_INVALID', `${artifactPath}.sourceReleaseUrl`, 'sourceReleaseUrl must be a GitHub Release tag URL');
        if (releaseAsset && releasePage && !sameRelease(releaseAsset, releasePage)) {
          add('RELEASE_SOURCE_MISMATCH', artifactPath, 'url and sourceReleaseUrl must use the same owner, repository, and tag');
        }
        if (releaseAsset && isNonEmptyString(entry.filename) && releaseAsset.filename !== entry.filename) {
          add('ARTIFACT_FILENAME_MISMATCH', `${artifactPath}.filename`, 'decoded Release asset filename must equal filename');
        }
        if (entry.checksumUrl !== null) {
          const checksumAsset = parseGithubReleaseAsset(entry.checksumUrl);
          if (!checksumAsset) {
            add('CHECKSUM_URL_INVALID', `${artifactPath}.checksumUrl`, 'checksumUrl must be a fixed GitHub Release asset URL');
          } else if (releaseAsset && !sameRelease(releaseAsset, checksumAsset)) {
            add('CHECKSUM_SOURCE_MISMATCH', `${artifactPath}.checksumUrl`, 'checksumUrl must use the artifact owner, repository, and tag');
          }
        }
      } else if (entry.checksumAssetPattern === null && entry.platform !== 'darwin') {
        // CC Switch currently publishes no checksum text asset; API digest is the trust source.
      }

      const extension = EXTENSIONS[entry.installerType];
      if (!extension || (!dynamic && (typeof entry.filename !== 'string' || !entry.filename.toLowerCase().endsWith(extension)))) {
        add('INSTALLER_EXTENSION_MISMATCH', `${artifactPath}.filename`, 'filename extension must match installerType');
      }
      if (!dynamic && !isNonEmptyString(entry.sha256)) {
        add('CHECKSUM_MISSING', `${artifactPath}.sha256`, 'fixed SHA-256 is required');
      } else if (!dynamic && !/^[a-f0-9]{64}$/i.test(entry.sha256)) {
        add('SHA256_INVALID', `${artifactPath}.sha256`, 'sha256 must contain 64 hexadecimal characters');
      }
      if (!dynamic && (!Number.isInteger(entry.size) || entry.size <= 0)) {
        add('SIZE_INVALID', `${artifactPath}.size`, 'size must be a positive integer');
      }

      if (entry.platform === 'win32' && entry.arch === 'x64' && entry.binaryArchitecture !== 'x64') {
        add('BINARY_ARCHITECTURE_MISMATCH', `${artifactPath}.binaryArchitecture`, 'win32/x64 requires binaryArchitecture x64');
      }
      if (entry.platform === 'win32' && entry.arch === 'arm64' && entry.binaryArchitecture !== 'arm64') {
        add('BINARY_ARCHITECTURE_MISMATCH', `${artifactPath}.binaryArchitecture`, 'win32/arm64 requires binaryArchitecture arm64');
      }
      if (entry.platform === 'darwin' && entry.arch === 'arm64' && !['arm64', 'universal'].includes(entry.binaryArchitecture)) {
        add('BINARY_ARCHITECTURE_MISMATCH', `${artifactPath}.binaryArchitecture`, 'darwin/arm64 requires binaryArchitecture arm64 or universal');
      }

      if (entry.platform === 'darwin') {
        if (!entry.bundleId) add('MACOS_BUNDLE_ID_MISSING', `${artifactPath}.bundleId`, 'macOS bundleId is required');
        if (!entry.bundleExecutable) add('MACOS_EXECUTABLE_MISSING', `${artifactPath}.bundleExecutable`, 'macOS bundleExecutable is required');
        if (!entry.appName) add('MACOS_APP_NAME_MISSING', `${artifactPath}.appName`, 'macOS appName is required');
        if (!['arm64', 'universal'].includes(entry.binaryArchitecture)) {
          add('MACOS_ARCHITECTURE_INVALID', `${artifactPath}.binaryArchitecture`, 'macOS binary must include arm64');
        }
      }
    });

    for (const [platform, arch] of EXPECTED_TARGETS) {
      if (!targetKeys.has(`${platform}/${arch}`)) {
        add('EXPECTED_ARTIFACT_MISSING', softwarePath, `missing artifact: ${platform}/${arch}`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

function assertManifestValid(manifest = SOFTWARE_MANIFEST) {
  const result = validateManifest(manifest);
  if (result.valid) return result;
  const error = new Error(result.errors.map(({ code, path, message }) => `${code} ${path}: ${message}`).join('\n'));
  error.code = 'MANIFEST_INVALID';
  error.validationErrors = result.errors;
  throw error;
}

if (require.main === module) {
  const result = validateManifest(SOFTWARE_MANIFEST);
  if (!result.valid) {
    for (const error of result.errors) console.error(`${error.code} ${error.path}: ${error.message}`);
    process.exitCode = 1;
  } else {
    const artifactCount = SOFTWARE_MANIFEST.software.reduce((total, software) => total + software.artifacts.length, 0);
    console.log(`Manifest valid: ${SOFTWARE_MANIFEST.software.length} software entries, ${artifactCount} artifacts`);
  }
}

module.exports = {
  assertManifestValid,
  EXPECTED_TARGETS,
  validateManifest,
};
