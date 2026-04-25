import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(currentFilePath), "..");

function readProjectFile(relativePath) {
  return readFileSync(join(projectRoot, relativePath), "utf8");
}

test("experiments config uses the requested English copy and page versions", () => {
  const file = readProjectFile("src/lib/experiments.ts");

  const requiredStrings = [
    'pageVersion: "study1-page2-v4-en"',
    'pageVersion: "study1-page3-v4-en"',
    'pageVersion: "study2-page2-v4-en"',
    '"Please imagine that you are browsing an NFT marketplace."',
    '"The item below is an NFT collection displayed on the platform."',
    '"Please carefully review the information shown on this page. Later questions will ask about specific content from this page, so please answer based on the information provided here."',
    '"Please review the information above as you normally would when browsing an NFT marketplace."',
    '"Click “Next” to continue."',
    '"Now, please continue browsing the NFT collection shown below."',
    '"Please continue to carefully review the information shown on this page. The next questions will refer to these two NFT collections, so please answer based on the information provided."',
    '"Please answer the next questions based on your impressions of the two NFT collections you just viewed."',
    '"The following are two NFT collections displayed on the platform."',
    '"First NFT collection"',
    '"Second NFT collection"',
    '"Please review this information as you normally would when browsing an NFT marketplace."',
  ];

  const forbiddenStrings = [
    'pageVersion: "study1-page2-v3"',
    'pageVersion: "study1-page3-v3"',
    'pageVersion: "study2-page2-v3"',
    "请想象你正在浏览一个",
    "请认真查看本页展示的信息",
  ];

  for (const text of requiredStrings) {
    assert.ok(file.includes(text), `expected to find ${text}`);
  }

  for (const text of forbiddenStrings) {
    assert.ok(!file.includes(text), `expected not to find ${text}`);
  }
});

test("study runner shared UI strings are English for the target flows", () => {
  const file = readProjectFile("src/components/study-runner.tsx");

  const requiredStrings = [
    "Preparing study session...",
    "Previous",
    "Next",
    "Submit and Finish",
    '"Please complete all required items on this page before continuing."',
    '"Your local session was lost. Please return to the home page and start again."',
    '"Final submission failed. Please try again. The data has not been fully backed up."',
    '"Save failed. Please try again later."',
    "Study Snapshot",
    "Respondent",
    "Page",
    "Progress",
    "Privacy",
    "Anonymous",
  ];

  const forbiddenStrings = [
    "正在准备问卷",
    "上一页",
    "下一页",
    "提交并完成",
    "请完成本页所有必答项后再继续。",
    "本地会话丢失，请返回首页重新开始。",
    "最终提交失败，请重试。数据尚未完成备份。",
    "保存失败，请稍后重试。",
    "问卷快照",
    "受试者",
    "页码",
    "进度",
    "隐私",
    "匿名",
  ];

  for (const text of requiredStrings) {
    assert.ok(file.includes(text), `expected to find ${text}`);
  }

  for (const text of forbiddenStrings) {
    assert.ok(!file.includes(text), `expected not to find ${text}`);
  }
});

test("collection card labels stay fully English even when bilingual terms are requested", () => {
  const file = readProjectFile("src/components/collection-card.tsx");

  const requiredStrings = [
    '"Marketplace Preview"',
    '"Creator"',
    '"Created Date"',
    '"Floor Price"',
    '"Description"',
  ];

  const forbiddenStrings = [
    "平台预览",
    "创作者",
    "创建时间",
    "最低挂单价",
    "简介",
  ];

  for (const text of requiredStrings) {
    assert.ok(file.includes(text), `expected to find ${text}`);
  }

  for (const text of forbiddenStrings) {
    assert.ok(!file.includes(text), `expected not to find ${text}`);
  }
});
