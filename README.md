# NFT Imitation Experiment Platform

用于 `NFT imitation` 行为实验的 Web 项目，包含 4 个固定条件入口：

- `Study 1 / Control`
- `Study 1 / Treatment`
- `Study 2 / Control`
- `Study 2 / Treatment`

项目保留：

- 两个 study 的完整 7 页流程
- 逐页保存 API
- 完成提交 API
- respondent 会话保持
- mock / database 双模式数据层
- 极简 admin dashboard
- 统一的 collection data layer

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- App Router
- API routes

## Routes

### Fixed Entry Routes

- `/study1-control`
- `/study1-treatment`
- `/study2-control`
- `/study2-treatment`

### Survey Routes

- `/study/study1/control/page/1` 到 `/study/study1/control/page/7`
- `/study/study1/treatment/page/1` 到 `/study/study1/treatment/page/7`
- `/study/study2/control/page/1` 到 `/study/study2/control/page/7`
- `/study/study2/treatment/page/1` 到 `/study/study2/treatment/page/7`

### Other Routes

- `/`
- `/admin`
- `/thank-you/study1/control`
- `/thank-you/study1/treatment`
- `/thank-you/study2/control`
- `/thank-you/study2/treatment`

## Local Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

默认访问：

- [http://localhost:3000](http://localhost:3000)

生产构建检查：

```bash
npm run lint
npm run build
```

## Deploy

### Vercel

当前仓库已配置 GitHub Actions 触发的 Vercel 生产部署。

自动部署工作流文件：

- [.github/workflows/vercel-production.yml](/Users/uk5y/Documents/New%20project%202/nft-imitation-experiment-app/.github/workflows/vercel-production.yml)

GitHub 仓库需要以下 Actions secrets：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

如果需要绑定正式域名，部署平台侧配置完成后，把 `CUSTOM_DOMAIN` 填回环境变量。

### Other Hosts

本项目是标准 Next.js Node 运行时应用，也可部署到支持 Next.js 的平台，例如 Railway、Render、自建 Node 服务器。

## Study Logic

### Fixed route-driven condition

- `condition` 由路由固定，不再随机分组
- `study1-control` 永远进入 `Study 1 / Control`
- `study1-treatment` 永远进入 `Study 1 / Treatment`
- `study2-control` 永远进入 `Study 2 / Control`
- `study2-treatment` 永远进入 `Study 2 / Treatment`

### Respondent identity

- 首次进入某一条固定路径时自动生成 `respondent_id`
- 格式示例：`resp_study1_control_<uuid>`
- 会话保存在浏览器 `localStorage`
- `Study 1 / Control` 与 `Study 1 / Treatment` 会分别保存自己的本地 respondent/session

### Fixed-path test links

如需固定一个可复验的 respondent，会保留以下 query 参数：

- `respondent_id`
- `started_at`（可选）
- `reset=1`

示例：

```text
/study/study1/control/page/1?respondent_id=demo_study1_control&reset=1
```

`reset=1` 会覆盖当前浏览器里该固定路径已有的本地会话。

### Progressive saving

每次点击“下一页”都会向 `/api/page-events` 发送：

```json
{
  "respondent_id": "resp_study1_control_xxx",
  "study_id": "study1",
  "condition": "control",
  "page_number": 4,
  "page_version": "study1-page4-v1",
  "answers": {
    "attention_1": 6
  },
  "entered_at": "2026-03-18T12:00:00.000Z",
  "submitted_at": "2026-03-18T12:00:08.000Z",
  "duration_ms": 8000
}
```

最后一页还会向 `/api/respondents/finish` 发送：

```json
{
  "respondent_id": "resp_study1_control_xxx",
  "study_id": "study1",
  "condition": "control",
  "finished_at": "2026-03-18T12:05:00.000Z",
  "status": "completed"
}
```

### Mock mode vs production mode

#### Mock mode

当数据库占位符未填写时：

- 项目仍可完整运行
- API routes 会接受 payload
- server log 会打印本应写入数据库的数据
- browser console 会打印 mock save 信息
- 浏览器 `localStorage` 会缓存本机提交
- `/admin` 会显示 mock/local 概览

#### Production mode

当以下数据库相关变量填写完毕后，API routes 会尝试通过 REST 方式写入真实数据库：

- `NEXT_PUBLIC_DATABASE_URL`
- `DATABASE_SERVICE_ROLE_KEY`
- `RESPONSES_TABLE_NAME`
- `PAGE_EVENTS_TABLE_NAME`
- `RESPONDENTS_TABLE_NAME`

当前实现默认按照 Supabase REST 风格组织请求：

- `POST /rest/v1/<table>` 写入 page events 和 response snapshots
- `PATCH /rest/v1/<table>?respondent_id=eq...&study_id=eq...` 更新完成状态

如果你使用其他数据库或 API gateway，只需要在 [src/lib/storage.ts](/Users/uk5y/Documents/New%20project%202/nft-imitation-experiment-app/src/lib/storage.ts) 中替换 `databaseRequest` 及相关 `persist*` 方法。

## Environment Variables To Fill Later

以下变量已经预留，请保持名称不变：

- `NEXT_PUBLIC_DATABASE_URL`
- `NEXT_PUBLIC_DATABASE_ANON_KEY`
- `DATABASE_SERVICE_ROLE_KEY`
- `RESPONSES_TABLE_NAME`
- `PAGE_EVENTS_TABLE_NAME`
- `RESPONDENTS_TABLE_NAME`
- `API_BASE_URL`
- `ADMIN_DASHBOARD_PASSWORD`
- `CUSTOM_DOMAIN`

### How each placeholder is used

- `NEXT_PUBLIC_DATABASE_URL`
  当前 REST 数据库入口地址。默认按 Supabase REST 结构使用。
- `NEXT_PUBLIC_DATABASE_ANON_KEY`
  预留给未来 client-side database calls 或 RLS 扩展。当前原型的写入主要使用 service role。
- `DATABASE_SERVICE_ROLE_KEY`
  服务端写入数据库时使用。
- `RESPONSES_TABLE_NAME`
  保存每页回答快照。
- `PAGE_EVENTS_TABLE_NAME`
  保存逐页提交事件。
- `RESPONDENTS_TABLE_NAME`
  保存 respondent start / completion 状态。
- `API_BASE_URL`
  预留给未来把 `/api/*` 抽到独立后端服务时使用。当前同域部署可先保留占位。
- `ADMIN_DASHBOARD_PASSWORD`
  如果填写，`/admin` 将要求通过 query string 提供密码。
- `CUSTOM_DOMAIN`
  部署上线后的正式域名占位。

## Admin Dashboard

`/admin` 当前展示：

- total respondents
- completed respondents
- study1 / study2 counts
- control / treatment counts
- latest submissions

## Data Layer

统一 collection data layer 位于：

- [src/lib/collection-data.json](/Users/uk5y/Documents/New%20project%202/nft-imitation-experiment-app/src/lib/collection-data.json)

问卷流程与页面定义位于：

- [src/lib/experiments.ts](/Users/uk5y/Documents/New%20project%202/nft-imitation-experiment-app/src/lib/experiments.ts)

## Public References vs Mock Assets

### Public references used

- `PixelPaws`
  - [PIXEL PAWS NFT - Collection | OpenSea](https://opensea.io/collection/pixel-paws-nft)
  - [PixelPaw R02792 - pixelpawsnft | OpenSea](https://opensea.io/item/polygon/0x2953399124f0cbb46d2cbacd8a89cf0599974963/69805133742680201073878810953015015342123326143908381636191461620524265766913)
- `PixelPaws X`
  - [Pixelady Maker - Collection | OpenSea](https://opensea.io/collection/pixeladymaker)
  - [Mars Cats Voyage - Collection | OpenSea](https://opensea.io/collection/marscatsvoyage)
- `CyberWhales`
  - [Secret Society of Whales - Collection | OpenSea](https://opensea.io/collection/secretsocietyofwhales)

### What is normalized / mocked

- `PixelPaws / PixelPaws X / CyberWhales` 的最终实验展示 metadata 使用了实验规范中的固定字段
- 页面中的 artwork、thumbnail、cover visuals 为程序生成的统一 mock assets
- 视觉风格参考来自公开页面，但页面组件和 artwork 均为原创实现，不直接复制 OpenSea UI

## Project Structure

```text
src/
  app/
    admin/
    api/
      page-events/
      respondents/
        finish/
        start/
    study/
      [studyId]/
        [condition]/
          page/
            [pageNumber]/
    study1-control/
    study1-treatment/
    study2-control/
    study2-treatment/
    thank-you/
      [studyId]/
        [condition]/
  components/
    admin-dashboard.tsx
    collection-art.tsx
    collection-card.tsx
    experiment-entry.tsx
    likert-question-group.tsx
    study-runner.tsx
  lib/
    client-storage.ts
    collection-data.json
    config.ts
    dashboard.ts
    experiments.ts
    mock-storage.ts
    storage.ts
    types.ts
```
