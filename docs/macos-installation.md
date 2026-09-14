# macOS Apple Silicon 安装说明

## 支持范围

- Windows x64 和原生 Windows ARM64：正式支持。
- macOS Apple Silicon（`darwin/arm64`）：v1.0.0 已完成实机验证，正式支持。
- macOS Intel（`darwin/x64`）：不支持，也不提供 Intel 产物。

## 下载、校验与首次运行

1. 用户先从项目 [GitHub Release 页面](https://github.com/Fe1ix-deng/claude-codex-installer/releases/latest) 手动下载 `ai-installer-macos-arm64.dmg` 和 `SHA256SUMS.txt`。当前没有网页自动检测或自动选择下载功能。
2. 在终端校验文件：

   ```bash
   cd ~/Downloads
   shasum -a 256 ai-installer-macos-arm64.dmg
   ```

   将输出与 `SHA256SUMS.txt` 中对应条目比对，完全一致后再继续。
3. 双击 `ai-installer-macos-arm64.dmg`，在打开的磁盘映像中双击 `AI Installer.app`。
4. 如果 macOS 阻止打开 App：
   - 打开**系统设置** → **隐私与安全性** → **通用**；
   - 找到已阻止打开 `AI Installer.app` 的提示；
   - 点击**仍要打开**（Open Anyway）；
   - 输入 Mac 开机密码，或使用 Touch ID 确认。
5. 放行后重新双击 `AI Installer.app`，安装程序会打开 Terminal，并自动下载和安装 CC Switch、Claude Desktop 和 Codex。
6. 安装完成后，访问你的中转站网站，手动完成 API 密钥和 Provider 配置。安装器不会收集、保存或自动写入 API 密钥，也没有工具勾选界面。

## 安全说明

本项目长期保持未签名、未公证，不计划申请 Windows Authenticode 或 Apple Developer 签名/公证。首次运行只应对已从项目 Release 下载、且 SHA-256 校验通过的 DMG 单独放行。

不要关闭 Gatekeeper、SIP 或其他系统安全策略，不要删除 quarantine 属性，也不要直接运行 DMG 中的裸 Mach-O 文件。`.app` 是面向 Finder 的公开入口。

安装器只复制到当前用户的 `~/Applications`，不要求 `sudo`，也不会强制结束正在运行的应用。若目标应用正在运行，请退出后重试。

## 上游来源与致谢

安装器不构建、不修改、不托管 Claude/Codex 官方二进制文件。特别感谢以下两个开源上游项目：

- [Claude App Mirror](https://github.com/Wangnov/claude-app-mirror)
- [Codex App Mirror](https://github.com/Wangnov/codex-app-mirror)

CC Switch 的来源与许可证记录见 [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)。
