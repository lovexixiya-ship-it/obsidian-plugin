# obsidian记忆星云

obsidian记忆星云在 Obsidian 里把当前库的 Markdown 笔记画成三维螺旋星系。插件 ID 是 `galaxy-graph`，版本 `1.2.0`。作者是夕夕雅。

GitHub 仓库地址保持 [lovexixiya-ship-it/obsidian-plugin](https://github.com/lovexixiya-ship-it/obsidian-plugin)。本仓库由作者自行公开。Obsidian 官方未发布本插件，官方社区插件市场也未收录。

插件列表里的名称是 `obsidian记忆星云`。打开后的视图标题仍是「记忆星图」，命令名仍是「打开记忆星图视图」。

## 演示

[docs/demo.mp4](docs/demo.mp4)

这条演示做过隐私遮挡和静音：星图与顶部界面保留，右下笔记卡片被实色挡住，音轨已去掉。遮挡只加在演示成片上，插件界面本身没有这块遮挡。请把它看作处理后的演示，它不是未处理的原始录屏。画面右下角按插件原文重新叠了清晰署名：`创作者 夕夕雅 | 商用微信 cx355120343`。

<video src="docs/demo.mp4" controls muted playsinline></video>

GitHub 网页可能不播放上面的视频标签。请直接打开文件链接。

## 安装文件

仓库根目录有可直接复制的 `main.js`、`manifest.json`、`styles.css`、`three.min.js`。这些就是要安装的文件。仓库没有 TypeScript 工程，`node scripts/verify.js` 只做检查，不会编译出另一份插件。

可安装压缩包是根目录的 [obsidian记忆星云.zip](obsidian记忆星云.zip)。解压后得到 `galaxy-graph/` 目录，其中包含上述运行文件，以及 `LICENSE`、`LICENSE-THREE`、`NOTICE` 和本说明。

手动安装时，把解压得到的 `galaxy-graph` 目录放到自己的库里：

`.vault/.obsidian/plugins/galaxy-graph/`

目录名保持插件 ID `galaxy-graph`。路径里的 `.vault` 代表你的库根目录。

## 启用与打开

在 Obsidian 桌面版中打开设置，进入社区插件，关闭安全模式，启用「obsidian记忆星云」。

打开方式：点击左侧丝带的 sparkles 图标，或运行命令「打开记忆星图视图」。

## 依赖

- Obsidian 桌面版，`minAppVersion` 为 `1.0.0`
- 与 `main.js` 放在同一目录的 `three.min.js`（Three.js r128，随仓库提供）
- 本机 WebGL

`manifest.json` 中 `isDesktopOnly` 为 `true`。本地 `three.min.js` 由桌面端 `require("./three.min.js")` 加载。移动端尚未实测。

## 视图里有什么

- 读取当前库的 Markdown 文件，沿旋臂放置星点。库里没有 Markdown 文件时，绘制 120 个没有笔记对应的装饰星点。
- 悬停星点时，在本机卡片上显示笔记名、修改日期、正文开头约 110 个字符，以及库内相对路径。按钮在本机打开该笔记。
- 搜索框按笔记文件名在本地过滤。
- 拖动旋转星系，滚轮调整远近。
- 右下角画着原文水印：`创作者 夕夕雅 | 商用微信 cx355120343`。样式表里的 `.galaxy-watermark` 也保留。
- 左下角 ♪ 按钮在公开包里不读取音频，也不播放。公开包不含配乐文件。

笔记、配置和路径只出现在本机界面。插件不向服务器上传这些内容，也不从网络下载脚本。

## 公开包里的整理

- 水印原文保持不动。
- 去掉对 `bgm.mp3` 的读取和播放，避免缺少音频文件时出错。
- `three.min.js` 只从插件目录加载。已去掉 `new Function` 动态执行，也去掉失败后从 npmmirror 或 jsDelivr 拉取并执行远程脚本的路径。加载失败时，控制台记录错误，视图中央提示检查插件目录中的 `three.min.js`。
- 所附版本的清单写着 `isDesktopOnly: false`，同时用 Node 的 `fs` 与 `path` 读取插件目录。公开包不再使用 `fs`、`path` 和库的本机路径，并把 `isDesktopOnly` 设为 `true`。
- 清单中的可见名称改为 `obsidian记忆星云`。`id` 仍是 `galaxy-graph`，`version` 仍是 `1.2.0`。

## 卸载

删除 `.vault/.obsidian/plugins/galaxy-graph`。库里的笔记会保留。

## 许可证

插件自身代码（`main.js`、`styles.css`、`manifest.json`）使用 MIT 许可证，版权所有 Copyright (c) 2026 夕夕雅。全文见 [LICENSE](LICENSE)。MIT 允许使用、复制、修改和再分发，包括商业使用。画面上的「创作者 夕夕雅 | 商用微信 cx355120343」是联系信息，不是 MIT 的附加限制，也不构成付款条件。

`three.min.js` 与 Three.js r128 官方 `build/three.min.js`、以及 npm 包 `three@0.128.0` 的同名文件逐字节一致。版权归 Three.js Authors（2010–2021），许可证为 MIT。SHA-256：`9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2`。全文见 [LICENSE-THREE](LICENSE-THREE)，对照说明见 [NOTICE](NOTICE)。

Obsidian 应用及其 API 不在本仓库内，本许可证不覆盖它们。仓库不含音乐。

## 验证

在仓库根目录运行：

```bash
node scripts/verify.js
```

脚本检查语法、清单、水印原文、本地 three.js、压缩包内容和演示视频参数，并用模拟的 Obsidian 接口走一遍加载。输出里的生命周期结果是 Node 模拟。Obsidian 实机验收尚未进行，移动端尚未实测。
