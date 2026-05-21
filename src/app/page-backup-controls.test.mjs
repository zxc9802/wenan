import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("backup import and export controls are not rendered in the header", () => {
  [
    "handleExportBackup",
    "handleImportBackup",
    "导出打包备份",
    "导入还原资产备份",
    'accept=".json"',
  ].forEach((removedText) => {
    assert.equal(pageSource.includes(removedText), false, `${removedText} should not appear in page.tsx`);
  });
});
