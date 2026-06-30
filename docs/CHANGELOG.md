# 变更记录 · Changelog

> 项目实施过程的**人读**变更摘要。每完成一个 Step 或一次有意义的改动,在「未发布」区顶部追加一条(最新在上)。
>
> - **包级正式 changelog**:发布时由 Changesets 自动生成于各 `packages/*/CHANGELOG.md`,本文件不替代它。
> - **架构决策(ADR)**:见 [`docs/adr/`](adr/)。
> - **唯一事实源**:[`docs/impl-guide.md`](impl-guide.md);冲突以该文档为准。

---

## 未发布(Unreleased)

### Step 7 + 8 · 测试体系全链路 + Storybook · 2026-06-30
**包**:`docs`、`e2e`(均 private;无 Changeset —— 未改动任何已发布包的产物)
- **Storybook 8(`apps/docs`)**:`@storybook/react-vite` + `addon-essentials` + `addon-a11y`;`main.ts` 就近 glob `packages/kui/src/**/*.stories.tsx`;`preview.ts` 引入令牌 `vars.css`/`theme-dark.css`,工具栏切 `data-theme`(演示换肤,组件不改)。
- **Stories**:`button.stories.tsx`(Solid/AllVariants/Sizes/Loading)、`select.stories.tsx`(Default/Controlled);`autodocs` 自动 Props 表;受控示例抽成大写组件满足 rules-of-hooks。
- **Playwright(`e2e`)**:`playwright.config.ts` 以 Storybook(`--ci -p 6006`)为 webServer/渲染源,视觉 `maxDiffPixelRatio 0.01`。
  - E2E:`select.e2e.spec.ts` —— 键盘全流程(ArrowDown 开→高亮→Enter 选中,跳过 disabled)、disabled `force:true` 点击验证内核 no-op、时序断言(`aria-activedescendant` 指向真实节点)。
  - 视觉回归:`button-all-variants` / `button-sizes` / `select-open` 基线入库(`*-snapshots/*-darwin.png`)。
- **接线**:root 加 `storybook` / `build-storybook` / `e2e` 脚本;`@storybook/react` 同时加到 `docs` 与 `kui`(解决 pnpm 下 vite 从两处解析的问题)。
- 验证:`build-storybook` 编译通过;`pnpm --filter e2e e2e` **5 测试全绿**;全门槛(lint/typecheck/test/build/check:publish)未受影响。
- 偏差/注意:视觉基线带 OS 像素特征(`-darwin`),CI(Linux)首次需重生成基线 —— 留 Step 9。Storybook 部署(GitHub Pages)属基建,留 Step 9。

### Step 6 · Select(Headless 内核 + 键盘 + a11y)· 2026-06-30
**包**:`@fengnovo/kui`(minor)
- `src/select/use-select.ts` —— Headless 内核:交互状态机 + 键盘(↑↓/Home/End/Enter/Space/Esc)+ ARIA + 受控/非受控。仅 import React hooks、无 DOM 查询,`renderHook` 可纯逻辑测。
  - 键盘跳过 disabled:在 `enabledIdx`(可用项原始下标表)上环绕移动,disabled 下标不在移动空间。
  - aria-activedescendant 时序:虚拟焦点(焦点恒在 trigger);**先开后移**;`aria-activedescendant`/`aria-controls` 加 **open 守卫**,不指向已卸载节点。
  - 受控判定:`value !== undefined` 分流 `selected` 读取;`commit` 受控时跳过 `setInner`(不覆盖外部 value);`open`/`activeIndex` 恒内部态不受控。
- `src/select/select.tsx` —— 极薄渲染层:getters spread 到 `<button>`/`<ul>`/`<li>`;外部 pointerdown 关闭放此层 `useEffect`(不污染内核);支持 `aria-label`/`aria-labelledby`。
- `src/select/select.css` —— 只消费语义令牌 `var(--*)`;`[data-active]` 高亮、`[data-selected]` 选中、`[aria-disabled]` 禁用态。
- 测试:`use-select.test.ts`(17 例纯逻辑)+ `select.test.tsx`(10 例集成/axe,含**时序断言**:`aria-activedescendant` 指向的 id 真实存在于 DOM)。**覆盖率 100% 行/函数**。
- 接线:barrel 加 `select`;`tsup` entry 加 `src/select/index.ts`;`exports` 加 `./select`(condition-specific types)。
- 改进(相对 §6):open 守卫、`move` 空表守卫、`aria-haspopup=listbox`、外部点击关闭、combobox 可达名称。
- 验证:37 测试全绿;`./select` 子路径 publint/attw 全绿;esbuild 实测 `import '@fengnovo/kui/select'` **不含 Button 代码**(kui-btn),按需打包成立。
- 边界:typeahead / scrollIntoView / 打开即高亮选中项 标注为后续。`noUncheckedIndexedAccess` 下索引访问以 `?? -1` / `opt?` 做类型安全收口。

### Step 5 · Button 垂直切片(全链路打通)· 2026-06-30
**包**:`@fengnovo/kui`(minor)
- `button.tsx`:新增 `loading` —— 置灰禁用(`disabled || loading`)+ `aria-busy`(loading 时)+ 渲染 spinner;`disabled` 显式取出避免被 `{...rest}` 覆盖。
- `button.css`:新增 `.kui-btn__spinner` + `@keyframes kui-spin`,边框用 `currentColor`(随文字色自适配,非裸色值、stylelint 通过)。
- 测试栈(guide §7 雏形):`vitest.config.ts`(happy-dom + globals + v8 覆盖率,门槛 lines/functions 80)、`vitest.setup.ts`(jest-dom + vitest-axe matchers);`kui` 加 `test: vitest run --coverage`。
- `button.test.tsx`:10 条用例,覆盖默认/variant/size 映射、className 合并、loading(禁用+aria-busy+spinner)、未 loading 反例、disabled 透传、ref 转发、原生 props 透传、loading 时不触发 onClick、axe 无障碍。**覆盖率 100%**。
- `tsconfig.json`:exclude `*.test.*` / `*.stories.tsx` —— `tsc` 守库代码,行为交给 vitest。
- 验证:`pnpm test`(turbo)全绿;`dist` 无 test/story 污染、spinner css 已入产物;`publint` / `attw` 仍全绿。
- 边界:Story 文件与 Storybook 一起归 **Step 8**(避免现在引入悬空 `@storybook/*` 依赖)。

### Step 4 · 样式落地(CSS Vars + cva) · 2026-06-30
**包**:`@fengnovo/kui`(minor)
- `src/button/button.variants.ts`:cva 定义 `variant(solid/outline/ghost)` × `size(sm/md/lg)` + `defaultVariants`,props→className 纯映射、零运行时。
- `src/button/button.css`:真实样式只消费语义令牌 `var(--*)`(`brand-primary` / `brand-primary-hover` / `text-on-brand` / `bg-subtle` 等),无裸色值;含 hover / disabled / focus-visible 态。
- `src/button/button.tsx`:占位升级为接上 `buttonVariants`(`variant/size → className`);`loading/spinner/aria-busy` 留 Step 5。
- stylelint:`stylelint.config.mjs`(`color-no-hex` + `color-named:never`)纳入 `kui` 的 `lint`,裸色值视为 error(已负向测试验证可拦截 `#fff` / `red`)。
- **CSS 消费策略(决策)**:组件 CSS 不打包 tokens 的 `vars.css`,仅 `var()` 引用;变量底座由消费者/Storybook 显式 `import '@fengnovo/kui-tokens/vars.css'` 提供。`kui` 将 `@fengnovo/kui-tokens` 列为 `dependency`。理由:令牌作为主题底座应可独立换版本/切主题文件,不被复制进组件包。
- 验证:Button 用到的 4 个 `var(--*)` 全部在 `vars.css` 定义(0 缺失);其中 `--bg-subtle` 在 `theme-dark.css` 被覆盖 → 暗色下 hover 自动适配、组件不动。视觉换肤截图待 Step 8(Storybook)。

### 文档与流程 · 2026-06-30
- 新增本变更记录 `docs/CHANGELOG.md`,回填 Step 1–3;在 `CLAUDE.md` 工程硬规则中约定「每个 Step/变更结束需在此追加记录」。
- 新增项目 `README.md`:含 5 张 Mermaid 图(Monorepo 包依赖、组件库分层架构、构建产物流水线、单组件全链路、两段式发布时序)+ 包布局表 + 进度表 + 常用命令。

### Step 3 · 设计令牌管线 · 2026-06-30
**包**:`@fengnovo/kui-tokens`(新增,minor)
- DTCG 单一可信源:基础 `src/color.json` + 语义 `src/semantic.json` + 暗色增量 `src/semantic.dark.json`。
- Style Dictionary 4(`sd.config.mjs`)产出:`dist/vars.css`(`:root`)、`dist/tokens.js` + `dist/tokens.d.ts`(类型安全常量)、`dist/theme-dark.css`(`[data-theme="dark"]` 语义层增量覆盖,零运行时换肤)。
- 设计:三层令牌(基础→语义),组件只消费语义层;暗色由 SD `filter` 仅输出变化的语义变量,杜绝手写漂移。
- 偏离 guide:示例的 `tokens.ts` 改产 `tokens.js + tokens.d.ts`,符合发布包规范(publint/attw)。
- 待办:`kui` 真正 `import '@fengnovo/kui-tokens/vars.css'` 消费样式 → Step 4;切肤的视觉验证 → Step 8(Storybook)。

### Step 1–2 · Monorepo 骨架 + 构建产物体系 · 2026-06-30
**包**:`@fengnovo/kui`(新增,minor)、内部包 `@fengnovo/kui-tsconfig` / `@fengnovo/kui-eslint-config`(private)
- **Step 1 工程骨架**:`pnpm-workspace.yaml`、root `package.json`(`packageManager: pnpm@10` / turbo scripts / `onlyBuiltDependencies:[esbuild]`)、`turbo.json`(2.x `tasks`,非 `pipeline`)、`.npmrc`、`.gitignore`、`.changeset/config.json`(access public);共享 `tsconfig/base.json`(`moduleResolution:Bundler` + strict + `verbatimModuleSyntax`)、`eslint-config`(最小 flat config)。
- **Step 2 构建产物**:`tsup` 输出 ESM + CJS 双格式 + 独立组件入口(`.` / `./button`)+ 独立 `.css`(`injectStyle:false` + `sideEffects:["**/*.css"]`);`exports` 采用 condition-specific types(`import`→`.d.ts` / `require`→`.d.cts`);`publint`「All good!」+ `@arethetypeswrong/cli`(`--profile node16`,node16/bundler 全绿)通过。含最小占位 Button(Step 5 替换为真实实现)。
- **验证**:`pnpm install` 成功;`pnpm build` 二次 `>>> FULL TURBO` 缓存命中;`pnpm lint` / `pnpm typecheck` 0 error。
- **决策**:[`docs/adr/0001-exports-condition-specific-types.md`](adr/0001-exports-condition-specific-types.md)——exports 偏离 guide §2.2 的理由;环境偏差 `packageManager` 锁 `pnpm@10`、`engines.node>=18`、attw 弃 node10。
