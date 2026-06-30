---
"@fengnovo/kui": minor
---

新增 Select(combobox/listbox):交互状态机、键盘导航(↑↓/Home/End/Enter/Space/Esc)、ARIA、受控/非受控全部沉淀进可脱离 DOM 单测的 Headless Hook `useSelect`,渲染层只做 state→DOM 映射 + prop getters。键盘在"可用项下标表"上移动天然跳过 disabled;`aria-activedescendant`/`aria-controls` 加 open 守卫(不指向已卸载节点);`value !== undefined` 判定受控、内部 state 绝不覆盖外部 value。trigger 支持 `aria-label`/`aria-labelledby`(combobox 必须有可达名称),渲染层处理外部 pointerdown 关闭。独立入口 `@fengnovo/kui/select` 可按需打包(不含 Button)。
