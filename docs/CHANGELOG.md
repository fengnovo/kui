# 变更记录 · Changelog

> 项目实施过程的**人读**变更摘要。每完成一个 Step 或一次有意义的改动,在「未发布」区顶部追加一条(最新在上)。
>
> - **包级正式 changelog**:发布时由 Changesets 自动生成于各 `packages/*/CHANGELOG.md`,本文件不替代它。
> - **架构决策(ADR)**:见 [`docs/adr/`](adr/)。
> - **唯一事实源**:[`docs/impl-guide.md`](impl-guide.md);冲突以该文档为准。

---

## 未发布(Unreleased)

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
