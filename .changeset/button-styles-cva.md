---
"@fengnovo/kui": minor
---

Button 样式落地:用 cva(`button.variants.ts`)做 `variant(solid/outline/ghost)` × `size(sm/md/lg)` 的 props→className 映射,零运行时;`button.css` 全部消费语义令牌 `var(--*)`、无裸色值;接 `@fengnovo/kui-tokens` 提供的变量底座,切 `data-theme` 即换肤、组件代码不动。新增 stylelint(`color-no-hex` + `color-named:never`)纳入 `lint`,裸色值视为 error。
