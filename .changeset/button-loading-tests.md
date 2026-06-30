---
"@fengnovo/kui": minor
---

Button 垂直切片打通全链路:新增 `loading`(置灰禁用 + `aria-busy` + spinner,spinner 用 `currentColor` 随文字色自适配);落地 Vitest + Testing Library + axe 测试栈,Button 单测覆盖变体映射 / className 合并 / loading / disabled / ref 透传 / 原生 props 透传 / 无障碍,覆盖率 100%(门槛 80%)。测试文件不进发布产物,`publint` / `attw` 仍全绿。
