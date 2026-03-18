# NFT Imitation Experiment Platform

用于 `NFT imitation` 行为实验的双 study Web 项目。项目实现了：

- `Study 1: Sequential Exposure Experiment`
- `Study 2: Joint Display Experiment`
- 本地随机分组 `control / treatment`
- respondent 会话保持
- 逐页保存 API
- 完成提交 API
- mock/local fallback
- 极简 admin dashboard 原型
- 统一的 collection data layer

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- App Router
- API routes

## Routes

- `/`：Landing
- `/study-1`：Study 1 独立入口
- `/study-2`：Study 2 独立入口
- `/study/study1/page/1` 到 `/study/study1/page/7`
- `/study/study2/page/1` 到 `/study/study2/page/7`
- `/thank-you/study1`
- `/thank-you/study2`
- `/admin`

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

推荐直接导入此项目到 Vercel，或在本地执行：

```bash
npx vercel
```

如果需要绑定正式域名，部署平台侧配置完成后，把 `CUSTOM_DOMAIN` 填回环境变量。

### Other Hosts

本项目是标准 Next.js Node 运行时应用，也可部署到支持 Next.js 的平台，例如 Railway、Render、自建 Node 服务器。

## Study Logic

### Random assignment

- `Study 1` 内部随机分配 `control / treatment`
- `Study 2` 内部随机分配 `control / treatment`
- 分组信息写入浏览器 `localStorage`
- 同一受试者在本地会话中刷新页面后不会改变 condition

### Respondent identity

- 首次进入某个 study 时自动生成 `respondent_id`
- 格式示例：`resp_study1_<uuid>`
- respondent 会话保存于浏览器本地

### Progressive saving

每次点击“下一页”都会向 `/api/page-events` 发送：

```json
{
  "respondent_id": "resp_study1_xxx",
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
  "respondent_id": "resp_study1_xxx",
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
- `/admin` 会合并 server mock 和当前浏览器缓存显示概览

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

如果你使用其他数据库或 API gateway，只需要在 [src/lib/storage.ts](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app/src/lib/storage.ts) 中替换 `databaseRequest` 及相关 `persist*` 方法。

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

如果未接数据库，则显示 mock/local data 概览。

## Data Layer

统一 collection data layer 位于：

- [src/lib/collection-data.json](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app/src/lib/collection-data.json)

问卷流程与页面定义位于：

- [src/lib/experiments.ts](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app/src/lib/experiments.ts)

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
        page/
          [pageNumber]/
    study-1/
    study-2/
    thank-you/
      [studyId]/
  components/
    admin-dashboard.tsx
    collection-art.tsx
    collection-card.tsx
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

## Key Files

- Landing page: [src/app/page.tsx](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app/src/app/page.tsx)
- Study runner: [src/components/study-runner.tsx](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app/src/components/study-runner.tsx)
- Database/mock abstraction: [src/lib/storage.ts](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app/src/lib/storage.ts)
- Local session/cache: [src/lib/client-storage.ts](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app/src/lib/client-storage.ts)
- Admin summary logic: [src/lib/dashboard.ts](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app/src/lib/dashboard.ts)

## Notes

- 问卷中文题干和题项已按原文保留。
- 当前实现没有接入真实数据库 schema migration；你只需按上述字段准备表结构，并在 `storage.ts` 对应 REST 字段名保持一致即可。
- 如果未来要把 admin dashboard 改为正式后台，建议把 `ADMIN_DASHBOARD_PASSWORD` 换成真正的鉴权机制。
