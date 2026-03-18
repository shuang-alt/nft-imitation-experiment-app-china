# EdgeOne Pages 部署说明

本仓库已经整理为可直接接入 Tencent Cloud EdgeOne Pages 的状态，目标是：

- 前端继续使用 Next.js App Router
- 线上 `/api/*` 由根目录 `edge-functions/api/[[default]].js` 接管
- 问卷数据写入 EdgeOne Pages KV
- 研究者后台 `/admin` 通过密码登录后查看统计并导出

## 1. 从 GitHub 导入仓库

1. 打开 EdgeOne Pages 控制台。
2. 选择从 GitHub 导入仓库。
3. 连接仓库：
   `shuang-alt/nft-imitation-experiment-app-china`
4. Project Name 可直接使用：
   `nft-imitation-experiment-app-china`
5. 首次部署先使用平台默认测试域名。

## 2. 构建设置

仓库根目录已经提供 `edgeone.json`，建议直接使用：

- Root Directory: `/`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: `22.11.0`

如果控制台识别到 `edgeone.json`，通常不需要再手动填写。

## 3. 需要配置的环境变量

至少配置以下变量：

- `ADMIN_DASHBOARD_PASSWORD`
  用于 `/admin` 登录密码。
- `ADMIN_SESSION_SECRET`
  用于签发 admin cookie 的随机 secret。

可选变量：

- `API_BASE_URL`
  可留空；如需显式指定站点绝对地址，可填默认域名或未来自定义域名。
- `CUSTOM_DOMAIN`
  当前阶段可留空，后续绑定自定义域名后再填写。

模板见：

- [`.env.example`](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app-china/.env.example)

## 4. 启用 Pages Functions + KV

### 创建 KV Namespace

1. 在 EdgeOne Pages 控制台启用 KV。
2. 新建一个 namespace，建议名称：
   `nft-imitation-experiment`

### 绑定 KV 到项目

在当前 Pages 项目中，把上述 namespace 绑定到变量名：

- `NFT_EXPERIMENT_KV`

这个变量名已经在代码中固定使用。不要改成别的名字，除非你同时修改：

- [`edge-functions/api/[[default]].js`](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app-china/edge-functions/api/[[default]].js)

## 5. 默认测试地址

部署成功后，EdgeOne Pages 会提供默认测试域名，形如：

- `https://<project-name>.edgeone.app`

当前阶段直接用该默认地址即可完成访问和问卷收数测试。

## 6. 路径接管方式

部署后：

- 页面请求继续由 Next.js 处理
- `/api/respondents/start`
- `/api/page-events`
- `/api/respondents/finish`
- `/api/admin/dataset`
- `/api/admin/export/json`
- `/api/admin/export/csv`

以上接口由 EdgeOne `edge-functions` 接管并写入 KV。

本地 `npm run dev` 时，这些路径仍走 Next 自带的 mock API，方便前端联调。

## 7. 推荐上线检查

部署完成后，至少执行一次完整流程：

1. 访问任一固定入口，例如 `/study1-control`
2. 走完整个 7 页流程
3. 确认跳转到 thank-you 页面
4. 打开 `/admin`
5. 输入 `ADMIN_DASHBOARD_PASSWORD`
6. 检查总提交数、完成数、最近提交记录
7. 测试 `Export JSON` 和 `Export CSV`

## 8. 本地检查

```bash
npm install
cp .env.example .env.local
npm run lint
npm run build
```

已在本仓库完成的本地检查：

- `npm run lint`
- `npm run build`
