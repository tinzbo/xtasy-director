# Xtasy Director

**把一份商品简报，做成可以继续创作和发布的内容包。**

面向创作者、品牌与工作室的中文导演工作台。包括真实项目存储、三种内容模板、Jev 模板判断、逐镜编辑、产品图片上传、分镜预览，以及可下载的 MP4 / ZIP 成品包。

## 可以直接完成什么

1. 输入商品、受众、卖点、风格、时长和画幅；也可直接用内置「晨间陶杯」示例。
2. 让 Jev 选择「静物编辑部 / 卖点直达 / 日常的一幕」，或手动指定模板。
3. 编辑每个镜头的字幕、画面说明、停留时间，上传或切换产品图片。
4. 保存项目，查看逐镜预览，制作真实的视频与素材包。
5. 重启后从项目库继续工作；导出历史同样保留。

内置示例包含原创陶杯图片，无需付费服务就能完成一次制作。Jev 只进行语义判断；未配置、超时或低置信度时，界面明确显示本地模板或回退状态。脚本由程序根据用户材料编排，**没有模拟 AI 生成或虚构渲染进度**。

## 快速启动

需要 **Node.js 22+、npm、FFmpeg**。请使用能正常运行的 Node 安装。

```bash
# macOS
brew install node ffmpeg

# Ubuntu / Debian（Node 22 请通过发行方或 nvm 安装）
sudo apt-get update && sudo apt-get install -y ffmpeg fonts-noto-cjk

npm ci
cp .env.example .env
npm run dev
```

打开 [http://127.0.0.1:4311](http://127.0.0.1:4311)。开发和生产均由同一个 Express 服务提供前端与 API，不需要第二个代理端口。开发热更新使用 24681 端口。

`.env` 可选配置：

```dotenv
TYPESAFE_API_KEY=
TYPESAFE_MODEL=jev-latest
PORT=4311
HOST=127.0.0.1
# DATA_DIR=/absolute/path/to/studio-data
# FFMPEG_PATH=/absolute/path/to/ffmpeg
```

有 Jev Key 时填写后重启。密钥始终位于服务器端，不会进入前端包。程序只读取这些配置，不覆盖现有密钥。Jev 默认每次自动选模板调用一次，10 秒超时，不自动重试；会产生对应 TypeSafe API 用量。手动选择模板不调用 API。

## 构建与运行

```bash
npm test
npm run build
npm start
```

`npm run build` 先进行 TypeScript 严格类型检查，再构建 `dist/` 前端与 `dist-server/` 后端。`npm start` 使用 Node 运行已编译后端和生产前端，命令兼容 Windows / macOS / Linux。页面初次打开会检测 FFmpeg 与 Jev 配置。

## 成品包内容

| 文件 | 内容 |
| --- | --- |
| `video.mp4` | H.264、24 fps、图片推近动效与画面字幕，无配音 |
| `cover.jpg` | 实际首镜画面，包含选择的产品素材 |
| `cover.svg` | 可编辑排版底稿；使用通用产品示意，不嵌入用户图片 |
| `captions.srt` | 与镜头时长一致的标准字幕 |
| `script.md` | 受众、风格、镜头说明、字幕 / 口播建议 |
| `project.json` | 简报、镜头、Jev 决策来源和素材元数据 |
| `scene-*.jpg` | 每个镜头的最终静帧 |

16:9 输出 1280×720，9:16 输出 720×1280，1:1 输出 960×960。当前成片方式是图片短片，可用于低成本内容制作与预演；不包含生成式视频、配音、声音设计或直接发布到社交平台。镜头脚本可以交给拍摄团队或另接视频生成服务。

## 本地存储与安全边界

- 默认监听 `127.0.0.1`，适合单人本地工作室；**没有多租户账户或权限系统**，不要直接暴露到公网。
- `.local/projects/` 保存 JSON 项目；`.local/assets/` 保存规范化后的 JPG；`.local/exports/` 保存每次导出。备份整个 `.local/` 即可保存项目和素材。
- 保存采用临时文件 + 原子重命名，并使用 revision 检测并发编辑冲突。
- 上传限制为每张 12 MB、每项目 24 张，限制真实图片格式和像素数量；图片重新编码，不保留外部格式内容。
- 文件访问仅允许 UUID 与固定导出文件名；命令使用 `spawn` 参数数组、无 shell。
- 每次仅执行一个渲染任务，FFmpeg 180 秒超时，服务器重启会把中断任务标记为失败。
- 同源 API 校验、速率限制、请求体限制；这些措施不能代替公网上线需要的认证与部署审查。
- `.env`、素材和导出已列入 `.gitignore`、`.dockerignore`；不得提交到仓库。
- 项目没有自动清理，删除本地 `.local` 前请先备份。未保存的逐镜编辑会在离开页面前提醒。

## Docker

```bash
docker build -t xtasy-director .
docker run --rm -p 127.0.0.1:4311:4311 \
  -v xtasy-director-data:/app/.local \
  --env-file .env -e HOST=0.0.0.0 xtasy-director
```

镜像内置 FFmpeg 与中文字体，容器内监听 `0.0.0.0`；上述端口映射仅绑定宿主机环回地址。镜像构建不带入 `.env` 或本地项目数据。

## 目录

```text
src/              React 工作台与响应式界面
shared/           前后端共享的领域类型
server/engine.ts  模板编排与 TypeSafe SDK 集成
server/store.ts   本地存储与项目写锁
server/render.ts  Sharp 画面合成、FFmpeg 视频与 ZIP
server/index.ts   Express API、上传与开发/生产入口
tests/            编排规则、校验、安全与完整导出行为测试
public/media/     内置演示素材（见 docs/media-provenance.md）
```

## 验证

`npm test` 包含：时长守恒、模板差异、SRT 时间轴、SVG 转义、非法输入、项目持久化、版本冲突、跨站请求拒绝、图片上传、外部素材拒绝，以及 FFmpeg 实际 MP4 / ZIP 输出。测试使用独立临时目录与端口，不调用付费 Jev。GitHub Actions 安装 FFmpeg 与中文字体后执行测试和生产构建。

参考：[TypeSafe JavaScript SDK](https://docs.typesafe.ai/sdk/javascript)、[Choice](https://docs.typesafe.ai/primitives/choice)。
