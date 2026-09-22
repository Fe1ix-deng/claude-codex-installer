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

test('project documentation identifies the nested repository as the sole project root', () => {
  const readme = read('README.md');
  assert.match(readme, /唯一项目根目录.*win-verify-macos-arm64/);
  assert.match(readme, /npm run validate:manifest/);
  assert.match(readme, /不再维护外层旧副本/);
});

test('manifest validation is part of the release workflows', () => {
  for (const file of [
    '.github/workflows/release-all.yml',
    '.github/workflows/package-windows-artifacts.yml',
    '.github/workflows/package-macos-arm64.yml',
  ]) {
    assert.match(read(file), /npm run validate:manifest/);
  }
});
