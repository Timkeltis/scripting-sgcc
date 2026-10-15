# 来源说明

本项目用于个人学习与自动化，当前方向为 Scripting 本机直连网上国网 Android 3.2.3 协议。未经用户真实账号验证；参考项目可运行不等于本移植已通过验证。

## 当前协议与移植参考

- [stevenjoezhang/hass-state-grid](https://github.com/stevenjoezhang/hass-state-grid)：网上国网协议、加密和设备令牌实现来源。已于 2026-10-14 核对上游 [LICENSE](https://github.com/stevenjoezhang/hass-state-grid/blob/master/LICENSE)，为 MIT，版权行为 `Copyright (c) 2026 stevenjoezhang`。完整文本保留于 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。作为代码来源不意味着需要安装 Home Assistant。
- [zhaohantao1360-hash/Hark — sgcc-hark.js](https://github.com/zhaohantao1360-hash/Hark/blob/main/sgcc-hark.js)：本机 JavaScript 直连核心的移植参考；`lib/direct-core.js` 保留了该来源说明。其脚本头注明协议与设备令牌算法来自上述 MIT 项目；这不等于 Hark 全仓库或全部新增代码均获 MIT 授权。
- [githubdulong](https://github.com/githubdulong)：补充参考入口；此处不对其全部仓库的代码采纳范围或许可证作统一声明，具体文件授权需逐项核实。

只有已核实的 hass-state-grid 来源部分在此明确声明 MIT。其他参考代码应遵循各自原作者及具体文件的授权；未核实的部分不应推定为 MIT，公开可读也不等于可任意再分发。

## 历史代码与来源

- [Yuheng0101/X](https://github.com/Yuheng0101/X) 的 [`Tasks/95598/95598.js`](https://github.com/Yuheng0101/X/blob/main/Tasks/95598/95598.js)：历史代理取数核心来源，`95598-upstream.js` 保存了构建所使用的上游输入副本。
- `95598.js`：在上述上游脚本基础上应用本仓库请求兼容补丁生成。
- `patch_sgcc.py`：Timkeltis 编写的本地补丁构建脚本。
- `95598-fixed.js`、`c02-fix.js`：Timkeltis 编写的请求兼容包装/补丁代码。
- `sgcc-fixed.loon.plugin`：Timkeltis 编写的接口调用配置。
- `sgcc_client/`：历史 NAS 方案中从 hass-state-grid 移植的 Python 数据实现；`service.py` 和相关部署文件是历史 HTTP 服务封装。
- 原 Scriptable 界面和功能思路参考：脑瓜，[反馈渠道](https://t.me/Scriptable_CN)、[anker1209](https://github.com/anker1209)。

这些历史 NAS、代理及重写文件暂留作为来源与迁移记录，不作为当前安装或运行依赖；不要按旧版本说明启动 NAS 服务或配置 BoxJS/重写。

所有上游代码的版权、署名和许可证仍归原作者及上游声明。本仓库自身的适配或补丁不改变上游授权，也不对全部参考代码作 MIT 概括授权。
