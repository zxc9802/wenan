import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("batch article result header shows the active article word count", () => {
  assert.match(pageSource, /字数约\s*\{activeBatchArticle\.content\.length\}字/);
  assert.match(pageSource, /activeBatchArticle\.fallbackUsed[\s\S]*?activeBatchArticle\.content\.length/);
});

test("Xiaohongshu prompts enforce native note style", () => {
  [
    "小红书图文笔记",
    "封面标题",
    "收藏型",
    "短段落",
    "避免口播腔",
    "平台专属写作规范",
    "收藏型避坑清单",
  ].forEach((requiredText) => {
    assert.match(pageSource, new RegExp(requiredText));
  });
});
