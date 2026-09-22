'use strict';

const {
  checkInstalled,
  downloadFile,
  DRY_RUN,
  explainMsiExitCode,
  formatBytes,
  INSTALL_PATH,
  installExe,
  installMsi,
  installSoftware,
  PRINT_TARGET,
  SOFTWARE_CONFIG: ALL_SOFTWARE_CONFIG,
  verifyDownloadedFileSize,
} = require('./install-all');
const { detectTarget } = require('./platform-support');

const SOFTWARE_CONFIG = Object.freeze(
  ALL_SOFTWARE_CONFIG.filter(({ id }) => id === 'cc-switch'),
);

async function main({ install = installSoftware } = {}) {
  const config = SOFTWARE_CONFIG[0];
  console.log('=== CC Switch 兼容安装入口 ===');
  console.log('[提示] artifact 元数据、下载和完整性校验统一由 install-all.js 与 software-manifest.js 管理');
  const result = await install(config);
  console.log(`CC Switch: ${result && result.status ? result.status : 'failed'}`);
  return result;
}

if (require.main === module) {
  if (PRINT_TARGET) {
    console.log(JSON.stringify(detectTarget()));
    process.exit(0);
  }
  main().catch((error) => {
    console.error(`[错误] ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  checkInstalled,
  downloadFile,
  DRY_RUN,
  explainMsiExitCode,
  formatBytes,
  INSTALL_PATH,
  installExe,
  installMsi,
  installSoftware,
  main,
  SOFTWARE_CONFIG,
  verifyDownloadedFileSize,
};
