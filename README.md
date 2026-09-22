# 一键安装 CC Switch + Claude Desktop + Codex

> 面向 API 中转站用户的一键安装工具，支持 **Windows 10 / 11（x64 / ARM64）** 与 **macOS Apple Silicon（M1 / M2 / M3 / M4）**。国内用户无需梯子，通过官方 CDN 镜像直接下载。双击运行后，3 分钟内完成 CC Switch、Claude Desktop 和 Codex 的下载与安装，无需手动找安装包或编辑配置文件。

---

## 目录

- [项目简介](#项目简介)
- [下载安装包](#下载安装包)
- [支持矩阵](#支持矩阵)
- [Windows 安装教程](#windows-安装教程)
- [macOS 安装教程](#macos-安装教程)
- [SHA-256 校验](#sha-256-校验)
- [安全与首次运行说明](#安全与首次运行说明)
- [运行中被阻止的解决方法](#运行中被阻止的解决方法)
- [上游来源与致谢](#上游来源与致谢)
- [当前 Release](#当前-release)
- [已知限制](#已知限制)
- [开发与贡献](#开发与贡献)

---

## 项目简介

本工具是一个独立可执行的安装向导，帮助 API 中转站用户在 **Windows 10 / Windows 11** 或 **macOS Apple Silicon** 上完成首次安装，从下载安装包到启动应用只需 3-5 分钟。

**核心能力**：

1. **自动检测系统架构**：识别 Windows x64 / ARM64、macOS Apple Silicon M1–M4，匹配对应的安装包
2. **国内直连下载**：Claude Desktop 和 Codex 通过上游项目提供的 `agentsmirror.com` CDN 镜像下载，无需梯子
3. **一键安装三款工具**：自动下载并安装 [CC Switch](https://github.com/farion1231/cc-switch)、Claude Desktop 和 Codex
4. **SHA-256 完整性校验**：每个下载文件都通过 GitHub Release API 返回的 digest 自动校验，确保未被篡改

安装完成后，用户需手动访问中转站网站导入 API 密钥，并在 Claude Desktop 和 Codex 的设置中将 Provider 切换为 CC Switch。本工具不获取、存储或自动写入 API 密钥，也不负责软件的后续更新。

---

## 下载安装包

前往 [Releases 页面](https://github.com/Fe1ix-deng/claude-codex-installer/releases/latest) 获取最新版本。

| 文件 | 平台 |
|------|------|
| `ai-installer-win-x64.exe` | Windows x64（64 位） |
| `ai-installer-win-arm64.exe` | Windows ARM64 |
| `ai-installer-macos-arm64.dmg` | macOS Apple Silicon（已验证） |

---

## 支持矩阵

| 平台 | 架构 | 状态 |
|------|------|------|
| Windows | x64 | ✅ 支持 |
| Windows | ARM64 | ✅ 支持 |
| macOS | Apple Silicon (arm64) | ✅ 已验证支持 |
| Windows | x86（32 位） | ❌ 不支持 |
| macOS | Intel (x86_64) | ⚠️ 暂不支持 / 未测试 |

---

## Windows 安装教程

1. 从 [Releases 页面](https://github.com/Fe1ix-deng/claude-codex-installer/releases/latest) 下载对应架构的 `.exe` 文件
2. 双击运行。若出现 **"Windows 已保护你的电脑"** 提示，点击 **更多信息** → **仍要运行**
3. 安装器自动完成：检测系统架构 → 调用 GitHub Release API 获取版本与 SHA-256 → 通过官方 CDN 下载三款工具 → 校验完整性 → 安装到系统
4. 安装完成后，访问你的中转站网站导入 API 密钥，然后在 Claude Desktop 和 Codex 的设置中将 Provider 设为 CC Switch

> **提示**：CC Switch 安装到 `%LOCALAPPDATA%\Programs\CC Switch`，安装过程由 Windows Installer 服务处理，必要时会自动请求权限。

---

## macOS 安装教程

> **支持范围**：macOS 版本已在 Apple Silicon（M1 / M2 / M3 / M4）实机验证，Intel Mac 暂不支持。

### 1. 下载并校验安装包

从 [Releases 页面](https://github.com/Fe1ix-deng/claude-codex-installer/releases/latest) 下载 `ai-installer-macos-arm64.dmg` 和 `SHA256SUMS.txt`，先按下方说明校验 SHA-256。不要直接运行裸 Mach-O 文件；面向 Finder 的公开入口是 DMG。

```bash
cd ~/Downloads
shasum -a 256 ai-installer-macos-arm64.dmg
```

### 2. 打开 DMG 并运行安装器

双击 `ai-installer-macos-arm64.dmg`，在打开的磁盘映像中双击 `AI Installer.app`。它会自动打开 Terminal，启动安装器，并保留安装日志。

### 3. 首次运行：按系统提示手动放行 Gatekeeper

由于安装器未经签名和公证，macOS 可能会阻止 DMG 或命令文件运行。请使用以下任一方式授权：

#### 方法一：Finder 右键打开（推荐）

1. 在 Finder 中找到下载的 DMG 或其中的 `AI Installer.app`。
2. **按住 Control 键**，同时单击文件，从菜单中选择**打开**（Open）。
3. 弹窗提示无法验证开发者时，点击**打开**（Open）确认运行。

#### 方法二：系统设置 Open Anyway

如果双击 `AI Installer.app` 后无法打开，或弹窗中只有"移到废纸篓"选项，请：

1. 打开**系统设置** → **隐私与安全性** → **通用**。
2. 向下滚动，找到已阻止打开 `AI Installer.app` 的提示。
3. 点击**仍要打开**（Open Anyway）。
4. 在系统确认框中输入 Mac 开机密码，或使用指纹（Touch ID）确认。

### 4. 自动安装并完成配置

授权后，安装器在终端中自动完成：检测系统架构 → 调用 GitHub Release API → 通过 `agentsmirror.com` CDN 下载 → SHA-256 校验 → 安装三款工具。安装完成后，访问你的中转站网站导入 API 密钥，并在 Claude / Codex 设置中将 Provider 切换为 CC Switch。

---

## SHA-256 校验

每个 Release 附带 `SHA256SUMS.txt` 文件，可用于验证下载文件的完整性，防止文件在传输过程中被篡改。

### Windows（PowerShell）

```powershell
Get-FileHash .\ai-installer-win-x64.exe -Algorithm SHA256
```

将输出的哈希值（不区分大小写）与 `SHA256SUMS.txt` 中对应条目逐字比对，完全一致则文件可信。

### macOS（终端）

```bash
shasum -a 256 ai-installer-macos-arm64.dmg
```

将输出与 `SHA256SUMS.txt` 中对应行比对，两者完全一致则文件未被篡改。

---

## 安全与首次运行说明

**当前版本的可执行文件均未经过代码签名（Windows Authenticode）或 Apple 公证（macOS Notarization）。**

- **Windows**：SmartScreen 可能弹出"Windows 已保护你的电脑"警告，点击"更多信息"→"仍要运行"即可通过。
- **macOS**：Gatekeeper 可能阻止未经公证的 DMG 或命令文件，请按[上方步骤](#3-首次运行按系统提示手动放行-gatekeeper)通过右键"打开"或系统设置"Open Anyway"对本文件单独授权。

### 不建议的操作

请**不要**为了运行本工具而执行以下命令，这些操作会大幅降低系统整体安全性：

```bash
# ❌ 不要执行这些命令
sudo spctl --master-disable          # 关闭 Gatekeeper
csrutil disable                      # 关闭 SIP（需重启进恢复模式）
```

关闭 Gatekeeper 或 SIP 会使整个系统对所有未签名软件敞开大门，远超运行本工具所需的权限范围。项目不会在后续版本中申请或维护 Windows/macOS 签名；推荐仅对已校验的项目 DMG 通过右键"打开"或"Open Anyway"单独授权。

---

## 运行中被阻止的解决方法

若在运行过程中（而非启动时）遇到以下任一提示：

- `"ai-installer-macos-arm64"已损坏，无法打开`
- `"AI Installer.app"已损坏，无法打开。您应该将它移到废纸篓。`
- `无法打开"AI Installer.app"，因为它来自身份不明的开发者。`
- `macOS 无法验证此 App 不包含恶意软件`

**解决步骤**：

1. 确认 DMG 已通过 SHA-256 校验（见[上方说明](#sha-256-校验)）
2. 打开 **系统设置** → **隐私与安全性** → **通用**，向下滚动查找"仍要打开"（Open Anyway）按钮
3. 点击后输入 Mac 开机密码或使用 Touch ID 确认
4. 若该选项未出现，请在 Finder 中找到 `AI Installer.app`，按住 Control 键单击，选择"打开"，在弹窗中点击"打开"

若安装器调起的子程序（CC Switch / Claude / Codex）也被阻止，同样在系统设置中为其单独授权。**不要关闭 Gatekeeper 或 SIP**——这些系统级保护机制的作用范围远超本工具，关闭后会降低整个 Mac 的安全性。

---

## 上游来源与致谢

本工具本身不构建、不修改、不托管 Claude/Codex 的官方二进制文件。所有软件均来自各自项目的 GitHub Release，下载过程使用 GitHub Release API 获取版本与 SHA-256，实际下载通过上游项目提供的 `agentsmirror.com` 官方 CDN 镜像完成，保证国内用户的连通性。

特别感谢以下开源项目及其维护者：

- [Claude App Mirror](https://github.com/Wangnov/claude-app-mirror) — 提供 Claude Desktop 国内可访问的 CDN 镜像
- [Codex App Mirror](https://github.com/Wangnov/codex-app-mirror) — 提供 Codex 国内可访问的 CDN 镜像
- [CC Switch](https://github.com/farion1231/cc-switch) — API 中转站密钥管理工具

| 软件 | 来源 | 许可证 |
|------|------|--------|
| CC Switch | [github.com/farion1231/cc-switch/releases](https://github.com/farion1231/cc-switch/releases) | MIT |
| Claude Desktop | [GitHub Release](https://github.com/Wangnov/claude-app-mirror/releases) + CDN `claudeapp.agentsmirror.com` | — |
| Codex | [GitHub Release](https://github.com/Wangnov/codex-app-mirror/releases) + CDN `codexapp.agentsmirror.com` | — |

完整的第三方许可证文本见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

---

## 当前 Release

→ **[查看 v1.0.0 Release](https://github.com/Fe1ix-deng/claude-codex-installer/releases/tag/v1.0.0)**

---

## 已知限制

- **macOS 首次启动需人工放行**：未签名、未公证的安装器可能被 Gatekeeper 阻止，请按上方步骤操作。
- **macOS Intel 暂不支持**：当前仅提供 Apple Silicon（arm64）构建，Intel Mac 用户请等待后续版本。
- **长期保持未签名**：Windows 安装包不含 Authenticode 签名，macOS 安装包不含代码签名和公证；请使用 `SHA256SUMS.txt` 校验下载文件。
- **需要手动配置 API**：安装器不会获取、保存或自动写入 API 密钥，也不会自动配置 Provider。
- **需要手动下载主安装器**：当前没有独立网页或在线检测服务，系统和架构检测只发生在用户启动已下载的安装器之后。

---

## 开发与贡献

> **普通用户请跳过本节**——以下内容仅供希望参与开发或构建的贡献者参考。

本项目的**唯一项目根目录**和**唯一 Git 仓库位置**是外层共享目录下的 `win-verify-macos-arm64/`：

```text
/Users/apple/Desktop/所有AI相关/Vibe coding project/一键安装ccs+codex+cc/win-verify-macos-arm64
```

所有源码修改、Git 操作、依赖安装、构建、测试和 Release 操作都必须在该目录执行。外层目录本身不是 Git 仓库，不再维护外层旧副本；不要把源码重新复制到外层，也不要从外层的历史文件或生成产物继续开发。

```bash
cd "/Users/apple/Desktop/所有AI相关/Vibe coding project/一键安装ccs+codex+cc/win-verify-macos-arm64"
npm ci
npm run validate:manifest
npm test
npm run build:win
npm run build:macos:arm64
```

`software-manifest.js` 是所有正式上游安装 artifact 的唯一来源配置。它声明 GitHub 仓库、资产匹配规则和上游官方 CDN 短链。安装器运行时调用对应仓库的 GitHub Release API `releases/latest` 获取版本、资产大小和 `digest`；Claude/Codex 在 Windows 和 macOS 上都使用上游 Release 说明提供的 `agentsmirror.com` CDN 短链下载。下载文件仍必须与 API 返回的 `size` 和 `digest` 完全一致，不会硬编码具体版本号。
