# 数据层说明

中国大陆部署版的正式收数后端使用：

- EdgeOne Pages Functions
- EdgeOne Pages KV

根目录实现位置：

- [`edge-functions/api/[[default]].js`](/Users/uk5y/Documents/New project 2/nft-imitation-experiment-app-china/edge-functions/api/[[default]].js)

## 1. 保存行为

前端产品体验保持不变：

- 进入固定入口后生成 respondent 会话
- 每页点击“下一页”时提交一次 page event
- 最后一页调用 finish
- 刷新后仍保持原 study / condition
- 四个固定入口结构不变

## 2. KV Key 结构

由于 EdgeOne KV key 只建议使用数字、字母和下划线，线上 key 采用下列结构：

- `respondent_<study>_<condition>_<hexRespondentId>`
- `submission_<study>_<condition>_<hexRespondentId>_<pageNumber>`

说明：

- `hexRespondentId` 是对原始 `respondent_id` 做十六进制编码后的结果
- 原始 `respondent_id` 仍完整保存在 value JSON 中
- `pageNumber` 使用零填充，便于按页排序

## 3. Respondent 记录

`respondent_*` 的 value 结构：

```json
{
  "respondent_id": "resp_study1_control_xxx",
  "study_id": "study1",
  "condition": "control",
  "started_at": "2026-03-18T12:00:00.000Z",
  "finished_at": "2026-03-18T12:05:00.000Z",
  "status": "completed",
  "last_page_number": 7
}
```

## 4. Page Submission 记录

`submission_*` 的 value 结构：

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

## 5. 幂等与覆盖策略

- `respondent/start`
  按 `study + condition + respondent_id` 覆盖 respondent 记录。
- `page-events`
  按 `study + condition + respondent_id + page_number` 覆盖同一页提交。
- `respondent/finish`
  覆盖 respondent 的完成状态与 `finished_at`。

因此：

- 重复提交同一页不会生成多份最终 page snapshot
- 最终导出结果以最新一版 page snapshot 为准
- 不会因为重复点击下一页而在研究导出中产生多份同页记录

## 6. 导出格式

## JSON

`/api/admin/export/json` 导出：

- `respondents`
- `page_submissions`
- `finishes`
- `answer_rows`

其中 `answer_rows` 为研究更易处理的长表结构。

## CSV

`/api/admin/export/csv` 导出长表格式，每行对应一个题项答案，包含：

- `respondent_id`
- `study_id`
- `condition`
- `started_at`
- `finished_at`
- `completion_status`
- `page_number`
- `page_version`
- `entered_at`
- `submitted_at`
- `duration_ms`
- `question_code`
- `response_value`

## 7. 最小后台

研究者后台路径：

- `/admin`

功能：

- 当前总提交数量
- 已完成问卷数量
- 按 study / condition 的统计
- 最近提交记录
- 导出 JSON
- 导出 CSV

保护方式：

- 通过 `ADMIN_DASHBOARD_PASSWORD` 登录
- 登录后设置 httpOnly cookie
- 导出接口同时接受 cookie 或请求头密码

## 8. 本地与线上区别

本地 `npm run dev`：

- 继续使用 Next 内置 API mock
- 便于纯前端联调

EdgeOne 线上部署：

- `/api/*` 由 `edge-functions` 接管
- 正式写入 KV
- admin 读取的也是 KV 数据
