---
"@fengnovo/kui": minor
---

初始化主包构建产物体系:tsup 输出 ESM + CJS 双格式、独立组件入口(`.` / `./button`)与独立 `.css`;`exports` 采用 condition-specific types(`import`→`.d.ts`、`require`→`.d.cts`),`sideEffects` 标记 CSS;`publint` 与 `@arethetypeswrong/cli` 产物体检通过(node16/bundler 全绿)。
