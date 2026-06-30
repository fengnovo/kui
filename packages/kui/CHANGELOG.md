# @fengnovo/kui

## 0.1.0

### Minor Changes

- 83f1cdb: Button 垂直切片打通全链路:新增 `loading`(置灰禁用 + `aria-busy` + spinner,spinner 用 `currentColor` 随文字色自适配);落地 Vitest + Testing Library + axe 测试栈,Button 单测覆盖变体映射 / className 合并 / loading / disabled / ref 透传 / 原生 props 透传 / 无障碍,覆盖率 100%(门槛 80%)。测试文件不进发布产物,`publint` / `attw` 仍全绿。
- 586155f: Button 样式落地:用 cva(`button.variants.ts`)做 `variant(solid/outline/ghost)` × `size(sm/md/lg)` 的 props→className 映射,零运行时;`button.css` 全部消费语义令牌 `var(--*)`、无裸色值;接 `@fengnovo/kui-tokens` 提供的变量底座,切 `data-theme` 即换肤、组件代码不动。新增 stylelint(`color-no-hex` + `color-named:never`)纳入 `lint`,裸色值视为 error。
- 630cd13: 初始化主包构建产物体系:tsup 输出 ESM + CJS 双格式、独立组件入口(`.` / `./button`)与独立 `.css`;`exports` 采用 condition-specific types(`import`→`.d.ts`、`require`→`.d.cts`),`sideEffects` 标记 CSS;`publint` 与 `@arethetypeswrong/cli` 产物体检通过(node16/bundler 全绿)。
- 78a023c: 新增 Select(combobox/listbox):交互状态机、键盘导航(↑↓/Home/End/Enter/Space/Esc)、ARIA、受控/非受控全部沉淀进可脱离 DOM 单测的 Headless Hook `useSelect`,渲染层只做 state→DOM 映射 + prop getters。键盘在"可用项下标表"上移动天然跳过 disabled;`aria-activedescendant`/`aria-controls` 加 open 守卫(不指向已卸载节点);`value !== undefined` 判定受控、内部 state 绝不覆盖外部 value。trigger 支持 `aria-label`/`aria-labelledby`(combobox 必须有可达名称),渲染层处理外部 pointerdown 关闭。独立入口 `@fengnovo/kui/select` 可按需打包(不含 Button)。

### Patch Changes

- Updated dependencies [732044d]
  - @fengnovo/kui-tokens@0.1.0
