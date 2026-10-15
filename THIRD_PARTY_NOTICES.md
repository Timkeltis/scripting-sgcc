# 第三方代码说明

## hass-state-grid：已核实的 MIT 来源

网上国网 Android 3.2.3 协议、加密和设备令牌算法源自
[stevenjoezhang/hass-state-grid](https://github.com/stevenjoezhang/hass-state-grid)。
历史 `sgcc_client/` 为该 Python 数据实现的移植；本机 JavaScript 直连核心通过
[Hark / sgcc-hark.js](https://github.com/zhaohantao1360-hash/Hark/blob/main/sgcc-hark.js)
参考、移植相应实现。

2026-10-14 从上游 [LICENSE](https://github.com/stevenjoezhang/hass-state-grid/blob/master/LICENSE)
核实以下版权行与完整许可文本。保留该文本不表示本仓库所有第三方材料都采用 MIT。

```text
MIT License

Copyright (c) 2026 stevenjoezhang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 其他参考与历史材料

- [Hark](https://github.com/zhaohantao1360-hash/Hark)：直连脚本移植参考。其对 hass-state-grid 算法的 MIT 归属说明，不构成对 Hark 全部新增代码的 MIT 授权证明。
- [githubdulong](https://github.com/githubdulong)：补充参考入口；未在此统一核实其各仓库、各文件的许可证，不宣称全部参考代码为 MIT。
- [Yuheng0101/X](https://github.com/Yuheng0101/X)：保留历史网上国网脚本快照；版权及授权以原作者和具体文件声明为准。

未核实授权的代码不应因公开可访问而视为自由授权；进一步复用或分发前需核对相应文件的许可证或取得许可。详情见 [SOURCES.md](SOURCES.md)。

旧 NAS、代理与重写文件仅作历史保留，不是当前安装或运行依赖。本机直连版本未经用户真实账号验证；本声明不是可用性或安全性保证。
