# 来源说明

本项目是面向 Scripting 的网上国网本机直连小组件。下列来源分别适用各自版权与许可证；公开可访问不代表可任意再分发。

## 设计与功能参考

展示设计、指标组合、用电图表、阶梯电量和个性化配置思路参考脑瓜的 Scriptable 网上国网小组件：

- [githubdulong/Script · Scriptable/SGCC.js](https://github.com/githubdulong/Script/blob/master/Scriptable/SGCC.js)
- [anker1209](https://github.com/anker1209)

本项目仅将相关设计与功能思路适配至 Scripting，不表示获得原作者维护、认可或官方背书。该参考脚本及其资源的版权与许可证以原项目和具体文件声明为准。

## Android 协议与设备令牌

网上国网 Android App 3.2.3 登录查询协议、加密和 Turing 设备令牌算法源自：

- [stevenjoezhang/hass-state-grid](https://github.com/stevenjoezhang/hass-state-grid)

上游 LICENSE 已核实为 MIT License，版权行为：

```text
Copyright (c) 2026 stevenjoezhang
```

完整许可文本见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

Scripting 的 JavaScript 移植与请求流程参考：

- [zhaohantao1360-hash/Hark · sgcc-hark.js](https://github.com/zhaohantao1360-hash/Hark/blob/main/sgcc-hark.js)
- [zhaohantao1360-hash/Hark · sgcc-hark.yaml](https://github.com/zhaohantao1360-hash/Hark/blob/main/sgcc-hark.yaml)

Hark 对上游算法的 MIT 归属说明，不构成其全部新增代码或整个仓库均采用 MIT 的证明。除已核实的 hass-state-grid 来源部分外，不应将所有参考代码概括为 MIT。
