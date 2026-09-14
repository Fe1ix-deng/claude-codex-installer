'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('README describes manual Release download and manual API configuration', () => {
  const readme = read('README.md');
  assert.match(readme, /Releases 页面/);
  assert.match(readme, /手动下载/);
  assert.match(readme, /不会.*自动写入 API 密钥/);
  assert.doesNotMatch(readme, /自动完成 CC Switch、Claude Desktop 和 Codex 的下载、安装与 API 密钥配置/);
  assert.doesNotMatch(readme, /勾选要安装的工具/);
  assert.doesNotMatch(readme, /分别输入对应分组的 API 密钥/);
});

test('macOS documentation describes Gatekeeper authorization and manual configuration', () => {
  const docs = read('docs/macos-installation.md');
  assert.match(docs, /手动下载/);
  assert.match(docs, /Open Anyway/);
  assert.match(docs, /不会.*自动写入 API 密钥/);
  assert.doesNotMatch(docs, /选择要安装的工具/);
});

test('legacy Windows release workflow cannot publish on version-tag pushes', () => {
  const workflow = read('.github/workflows/release-windows.yml');
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /push:/);
  assert.doesNotMatch(workflow, /SignPath/);
});
