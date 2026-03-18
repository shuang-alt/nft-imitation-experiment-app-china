# NFT Imitation Experiment App China

中国大陆部署版分叉仓库，基于源仓库：

- [shuang-alt/nft-imitation-experiment-app](https://github.com/shuang-alt/nft-imitation-experiment-app)

这个版本的目标不是重做实验，而是把现有前端实验项目迁移到适合中国大陆发放与收数的部署方式：

- 前端实验设计保持不变
- 4 个固定入口保持不变
- 问卷文字、页序、collection 展示逻辑保持不变
- 部署目标从 Vercel 调整为 Tencent Cloud EdgeOne Pages
- 正式收数后端改为 Pages Functions + KV

## 保留的实验结构

固定入口：

- `/study1-control`
- `/study1-treatment`
- `/study2-control`
- `/study2-treatment`

动态实验页：

- `/study/study1/control/page/1` 到 `/study/study1/control/page/7`
- `/study/study1/treatment/page/1` 到 `/study/study1/treatment/page/7`
- `/study/study2/control/page/1` 到 `/study/study2/control/page/7`
- `/study/study2/treatment/page/1` 到 `/study/study2/treatment/page/7`

其它页面：

- `/`
- `/admin`
- `/thank-you/study1/control`
- `/thank-you/study1/treatment`
- `/thank-you/study2/control`
- `/thank-you/study2/treatment`

## 当前实现状态

### 阶段 1

- 已从源仓库复制当前前端代码与实验路由结构
- 已移除 Vercel 专属工作流
- 已补 `edgeone.json`
- 已整理为可直接连接 EdgeOne Pages 的仓库

### 阶段 2

- 已新增正式收数后端：
  `edge-functions/api/[[default]].js`
- 已使用 Pages Functions + KV 保存 respondent 与逐页 submission
- 已保留本地 `mock` 调试能力
- 已把 admin 升级为可查看统计和导出 JSON / CSV
- 已加入最小密码保护与 cookie 登录

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- App Router
- EdgeOne Pages Functions
- EdgeOne KV

## 本地开发

```bash
npm install
cp .env.example .env.local
npm run dev
```

本地 `next dev` 下：

- 问卷页面与路由正常运行
- `/api/*` 仍使用 Next 本地 mock API
- 便于调试前端与提交流程

检查命令：

```bash
npm run lint
npm run build
```

## 正式部署

EdgeOne Pages 详细说明见：

- [EdgeOne Pages 部署说明](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app-china/docs/edgeone-pages-deployment.md)
- [数据层说明](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app-china/docs/data-layer.md)

关键设置如下：

- Root Directory: `/`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: `22.11.0`

## 环境变量

模板见：

- [`.env.example`](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app-china/.env.example)

至少建议在 EdgeOne Pages 项目中配置：

- `ADMIN_DASHBOARD_PASSWORD`
- `ADMIN_SESSION_SECRET`

可选：

- `API_BASE_URL`
- `CUSTOM_DOMAIN`

## Pages Functions + KV

线上正式收数依赖：

- EdgeOne Pages Functions
- EdgeOne KV 绑定变量名：`NFT_EXPERIMENT_KV`

KV key 结构：

- `respondent_<study>_<condition>_<hexRespondentId>`
- `submission_<study>_<condition>_<hexRespondentId>_<pageNumber>`

前端保存体验保持不变：

- 首次进入固定入口创建 respondent
- 每页点击下一页逐页保存
- 最后一页 finish
- 本地仍保留 respondent/session

## Admin / 导出

研究者后台路径：

- `/admin`

提供：

- 总提交数
- 完成数
- 按 study / condition 统计
- 最近提交记录
- 导出 JSON
- 导出 CSV

访问方式：

- 未配置 `ADMIN_DASHBOARD_PASSWORD` 时可直接访问
- 已配置后需登录，后台会设置 httpOnly cookie

## 已完成的本地验证

- `npm run lint`
- `npm run build`
