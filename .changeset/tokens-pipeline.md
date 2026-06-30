---
"@fengnovo/kui-tokens": minor
---

初始化设计令牌管线:DTCG JSON 单一可信源(基础 `color` + 语义 `brand/bg/border/text`),经 Style Dictionary 4 产出 `vars.css`(`:root` CSS Variables)、`tokens.js` + `tokens.d.ts`(类型安全常量),以及 `theme-dark.css`(语义层增量覆盖到 `[data-theme="dark"]`,零运行时换肤)。
