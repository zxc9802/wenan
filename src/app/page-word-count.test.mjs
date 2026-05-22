import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("batch article result header shows the active article word count", () => {
  assert.match(pageSource, /字数约\s*\{activeBatchArticle\.content\.length\}字/);
  assert.match(pageSource, /activeBatchArticle\.fallbackUsed[\s\S]*?activeBatchArticle\.content\.length/);
});
