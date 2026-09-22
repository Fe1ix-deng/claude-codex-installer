'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const allInstaller = require('./install-all');
const legacyInstaller = require('./install-cc-switch');

test('legacy CC Switch entry reuses the unified installer implementation', () => {
  assert.equal(legacyInstaller.checkInstalled, allInstaller.checkInstalled);
  assert.equal(legacyInstaller.downloadFile, allInstaller.downloadFile);
  assert.equal(legacyInstaller.installMsi, allInstaller.installMsi);
  assert.equal(legacyInstaller.installSoftware, allInstaller.installSoftware);
});

test('legacy CC Switch entry derives its only config from the unified manifest', () => {
  assert.deepEqual(legacyInstaller.SOFTWARE_CONFIG.map(({ id, name, autoInstall }) => ({ id, name, autoInstall })), [
    { id: 'cc-switch', name: 'CC Switch', autoInstall: true },
  ]);
  assert.equal(legacyInstaller.INSTALL_PATH, allInstaller.INSTALL_PATH);
});

test('legacy entry contains no independent latest Release discovery logic', () => {
  const source = fs.readFileSync(path.join(__dirname, 'install-cc-switch.js'), 'utf8');
  assert.doesNotMatch(source, /releases\/latest|repoOwner|filePattern|getLatestVersion/);
  assert.match(source, /require\('\.\/install-all'\)/);
});

test('legacy --print-target uses the same platform detector without installing', () => {
  const output = execFileSync(process.execPath, ['install-cc-switch.js', '--print-target'], {
    cwd: __dirname,
    encoding: 'utf8',
  });
  assert.deepEqual(JSON.parse(output), require('./platform-support').detectTarget());
  assert.doesNotMatch(output, /下载|安装|https?:\/\//);
});

test('legacy main returns the unified CC Switch install result', async () => {
  const calls = [];
  const result = await legacyInstaller.main({
    install: async (config) => {
      calls.push(config.id);
      return { status: 'installed' };
    },
  });
  assert.deepEqual(calls, ['cc-switch']);
  assert.deepEqual(result, { status: 'installed' });
});
