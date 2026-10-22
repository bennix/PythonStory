# 桃源寻码 · PythonStory

沿着一段连续故事，自学 Python。原创渔郎穿过溪流、桃林与村落，14 集、42 段剧情按课程顺序衔接。

## 本地运行

需要 Node.js 22.12 或更新版本。

```sh
npm ci
npm run dev
```

首页：`http://127.0.0.1:5174/`，连续剧情：`http://127.0.0.1:5174/journey.html`。

```sh
npm run build
npm run preview
```

## 当前功能

- Landing Page：故事介绍、可切换的 14 集学习路线、直接进入指定集数。
- 连续剧情：每集三段，14 / 14 / 20 秒自动衔接，可暂停、跳集与手动前进。
- PINOC 骨骼高斯渔郎、桃花山谷、四种免费库动作与三种定制动作候选。
- 30,000 簇近景风动植被示意，溪流、小路、桃树与六个固定检查机位。
- 剧情框自动选择上方空处避让人物，保留可读高度；检查笔记保存在浏览器本机。

**这是教学剧情与场景原型。Python 执行、独立作答、判题、完整 NPC 和自由行走尚未实现。剧情播放不计为学习通过。**

## 项目结构

`index.html` / `landing.*` 为首页；`journey.html` / `src.js` / `style.css` 为 3D 剧情；`story.js` 为 14 集脚本；`public/assets` 为本地模型和动作；`public/images` 为 AI 概念图与实际预览截图；`docs` 为策划和资产来源记录。

角色是 `.vsplat`，场景是 `.spz`，均为高斯资产而非传统网格。渲染使用 `@viggle/splat-engine` 与固定兼容版本 `playcanvas@2.18.0`。动作是 441 骨骼的 `splat-skeleton-glb`。吃饭等定制动作目前用候选 1 预览，未完成道具接触绑定；村童尚无独立模型。

## 发布

GitHub Actions 在 main 更新后构建两个页面，并发布 GitHub Pages。Vite 自动使用 `/PythonStory/` 路径。仓库需开启 Pages，来源选择 GitHub Actions。构建使用本地保存的模型文件，不依赖过期的 PINOC 签名链接。

## 素材说明

角色设定、全景与关键画面为 AI 生成视觉开发稿；3D 模型、场景与定制动作由 PINOC 生成。免费库取得走、跑、挥手、点头。首次生成共消耗 24 PINOC 积分，运行本项目不会自动提交任何付费生成任务。字体来自 Google Fonts，无法连接时使用设备宋体。第三方依赖和素材使用应遵循各自条款。
