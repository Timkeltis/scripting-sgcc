# SGCC

> **来源与用途说明**：本仓库为个人维护的公开备份与自用项目，设计参考 [githubdulong/Script 的 SGCC.js](https://github.com/githubdulong/Script/blob/master/Scriptable/SGCC.js)，协议实现参考 [stevenjoezhang/hass-state-grid](https://github.com/stevenjoezhang/hass-state-grid)。请尊重原作者权利；本仓库不是原作者或国家电网的官方发布渠道。

基于 **Scripting** 的 iOS 网上国网小组件，在本机完成登录与查询，展示电费余额、用电记录和年度阶梯电量。

> 真实账号登录、短信验证及地区兼容性需自行实测。

## 功能特性

- 本机直连网上国网 Android App 3.2.3 协议接口，无需部署服务。
- 支持账号密码登录、手动短信验证和多户号选择。
- 展示余额或欠费、日用电、本月用电、月度账单和年度累计。
- 支持年度阶梯、自定义户名、配色、指标组合及用电柱状图。
- 凭据与会话保存在本机 Keychain，关闭 iCloud 同步。
- 缓存优先，更新失败时保留上次成功数据。

目前支持 **小号（`systemSmall`）与中号（`systemMedium`）桌面小组件**。Android 3.2.3 为参考协议版本，不需要 Android 设备。

## 快速开始

### 安装

1. 在 iPhone 上安装 **Scripting**。
2. 将本项目导入 Scripting，保持项目目录结构完整。
3. 运行 **SGCC**，打开设置页。

### 登录

1. 填写网上国网账号和密码并保存。
2. 执行登录获取户号操作，选择默认账户。
3. 若提示新设备验证（`4006`），手动发送短信，填写六位验证码并提交，再获取户号。

首次登录需在设置页完成。小组件不会自动发送短信；未设置登录密码的用户，请先在官方 App 中设置。

### 添加小组件

在 iOS 桌面添加 Scripting 小号或中号组件，选择 **SGCC**。通过小组件参数指定显示账户：

| 参数 | 说明 |
| --- | --- |
| 留空 | 默认账户 |
| `1`、`2`、`3` | 对应序号的账户 |
| 自定义户名 | 匹配设置中的账户名称 |
| `demo` | 演示数据，不查询账号 |

## 使用说明

### 数据口径

- 最近一天用电取接口最新有效记录，不一定是昨天。
- 本月用电优先使用接口返回的累计值。
- 年度电量和阶梯使用接口报告的年度累计，不额外叠加当月；是否包含未结算当月，需对照官方 App 核实。
- 阶梯默认采用北京居民年度分界 **2880 / 4800 度**，其他地区请按当地标准调整。
- 数据可能存在发布延迟，查询时间不等于数据所属日期。

### 刷新与缓存

默认刷新间隔为 **6 小时**。缓存到期后尝试更新，失败时回退到已有缓存，并保留原更新时间；无缓存时显示错误提示。

实际刷新时间由 iOS 调度，不保证精确按间隔执行。登录失效或需要设备验证时，请返回设置页处理。

### 隐私与安全

账号、密码、会话和设备状态保存在本机 Keychain，不随 iCloud 同步。用电缓存位于本机共享目录，可能包含户号、户名及账单信息，请注意备份与截图隐私。

更换设备后需要重新登录。重置功能会清理凭据、会话和用电缓存。**请勿向仓库或公开反馈提交密码、验证码、令牌及完整户号。**

## 项目结构

以下为主要运行与测试文件：

```text
SGCC/
├── index.tsx                  # 设置、登录与短信验证
├── widget.tsx                 # 桌面小组件
├── lib/
│   ├── direct-core.js         # 加密、设备令牌与协议核心
│   ├── direct-runtime.ts      # Scripting 原生能力适配
│   ├── direct-normalize.ts    # 接口数据归一化
│   ├── credentials.ts        # 本机凭据管理
│   ├── api.ts                # 数据查询与缓存策略
│   ├── cache.ts              # 缓存读写
│   ├── calc.ts               # 用电与阶梯计算
│   ├── store.ts              # 设置存储
│   ├── types.ts              # 数据类型
│   └── direct-core.test.mjs   # 协议核心离线测试
└── test-direct.ts             # Scripting 离线集成测试
```

## 来源与致谢

### 设计与功能

展示设计、指标组合、用电图表、阶梯电量及个性化配置思路参考 **脑瓜的 Scriptable 网上国网小组件**，本项目将其适配到 Scripting。

- [Scriptable SGCC.js 参考脚本](https://github.com/githubdulong/Script/blob/master/Scriptable/SGCC.js)
- [原参考作者项目入口：anker1209](https://github.com/anker1209)

### Android 协议与设备令牌

登录查询协议及 Turing 设备令牌算法移植自 [stevenjoezhang/hass-state-grid](https://github.com/stevenjoezhang/hass-state-grid)：

> MIT License · Copyright (c) 2026 stevenjoezhang

JavaScript 移植与请求流程参考 [Hark / sgcc-hark.js](https://github.com/zhaohantao1360-hash/Hark/blob/main/sgcc-hark.js)（[配置入口](https://github.com/zhaohantao1360-hash/Hark/blob/main/sgcc-hark.yaml)）。

本项目在此基础上实现 Scripting 平台适配、本机凭据管理、短信操作、缓存及小组件接入。

## 授权与声明

各来源的授权分别适用。上游协议的 MIT 许可不代表所有参考界面、图标或脚本均采用 MIT；版权及许可文本见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

本项目使用非公开接口，可能随服务端调整而失效。离线测试通过不代表服务端已接受设备令牌或真实数据已验证。请仅用于本人或已获授权的账户，合理控制查询频率；所有账单、用电和计费信息以官方 App 为准。
