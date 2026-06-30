# CLAUDE.md · @fengnovo/kui 自研组件库

> 本文件是 Claude Code 每次会话自动加载的项目规则。请严格遵守。

## 项目目标
从 0 到 1 实现一个生产级自研组件库,发布到公共 npm 的个人 scope `@fengnovo`(与已有的 `@fengnovo/monitor-sdk` 同 scope)。**唯一事实源是 `docs/impl-guide.md`**(《自研组件库实现指南》)。所有实现以该文档的 Step 顺序、代码范式与 ✅ Done 验收点为准;有冲突时以文档为准,不要自由发挥。

**包布局**(npm scope 不能嵌套,故 `kui` 作包名前缀):主包 `@fengnovo/kui`(React 组件,目录 `packages/kui`)、`@fengnovo/kui-tokens`(令牌)、`@fengnovo/kui-icons`(图标);`tsconfig`/`eslint-config`/`docs`/`e2e` 为内部包,标 `private:true` 不发布。`@fengnovo/monitor-sdk` 是独立产品,不在本 repo。

## 技术栈(已锁定,不要再提选型)
- 包管理/编排:pnpm + Turborepo(Turbo 2.x,用 `tasks` 不是 `pipeline`)
- 打包:tsup(JS,ESM+CJS+独立组件入口)+ tsc/api-extractor(类型)
- 样式:Design Token → CSS Variables(主题底座) + 组件 CSS + cva(变体)
- 行为层:自研 Headless Hook(状态机式),交互/键盘/无障碍沉淀进可独立单测的内核
- 令牌:DTCG(W3C)JSON + Style Dictionary 4
- 测试:Vitest + Testing Library + axe + Playwright(E2E+视觉回归)
- 版本/发布:Changesets;文档:Storybook 8;CI:GitHub Actions(配 `changesets/action`,两段式发版:push main 开 Version PR → 合并后自动 publish)

## 工作方式(必须遵守)
1. **Plan-first**:任何非平凡任务(新组件、构建配置、复杂逻辑)先进入 plan mode,产出"要改哪些文件 / 关键决策与取舍 / 完成后我如何验证",等我批准再写代码。
2. **按 Step 推进**:一次只做文档里的一个 Step(或一个组件)。完成后停下,等我按 ✅ Done 实测通过,再进下一步。不要一次性铺多个组件。
3. **讲清楚再动手**:把我当资深 reviewer。解释"为什么这么设计"和取舍,必要时列备选方案;不要只丢代码。重大架构决策追加到 `docs/adr/`(一句话决策 + 理由)。
4. **基建交接**:遇到需要外部系统或凭据的步骤——建 GitHub 仓库、配置 `NPM_TOKEN` secret 与 `main` 分支保护、(可选)开 GitHub Pages、域名/SSL、首次 `publish` 发包——**停下**,只生成相关配置文件/模板(`.github/workflows/*`、`api-extractor.json` 等),并输出一份"我需要在 GitHub/npm 上手动做什么"的清单。**不要尝试连接外部系统或真正发包。**

## 工程硬规则(写组件时逐条满足 = DOD)
- 每个组件独立入口 `src/<name>/index.ts`,保证按需可 tree-shake。
- 组件 CSS **只消费语义令牌 CSS 变量,禁止裸色值**;换肤靠切 `data-theme`/`data-brand` 作用域。
- 复杂交互(open/active/键盘/焦点/受控)沉淀到 Headless Hook,**该 Hook 必须可脱离 DOM 单测**;渲染层只做 state→DOM 映射,保持极薄。
- 同时支持受控/非受控:`value !== undefined` 判定受控,内部 state 不得覆盖外部 value。
- `package.json` 必须设 `"sideEffects": ["**/*.css"]`,且每个 `exports` 入口都带 `types`;每个**发布包**设 `"publishConfig": { "access": "public" }`(scoped 包默认 restricted)。
- 每个组件至少 1 条 `axe` 无障碍断言;键盘可达;ARIA 正确。
- 每个 Step/组件结束:跑通 typecheck/lint/build,写一条 Changeset 变更说明,并在 `docs/CHANGELOG.md` 顶部「未发布」区追加一条人读变更记录(每次有意义的变更都补,不止 Step 收尾)。

## 质量门槛(达不到不算完成)
- TypeScript strict 通过;ESLint 0 error;Stylelint 0 error(裸色值视为 error)。
- 单测覆盖率 ≥ 80%,Headless 逻辑优先覆盖(键盘/受控/禁用项跳过等边界)。
- 发布前产物体检:`publint` 与 `@arethetypeswrong/cli --pack` 无 error。

## 沟通风格
- 中文回复;技术名词保留英文。
- 每个 Step 结束给:① 改了什么 ② 关键设计/取舍(简短) ③ 我需要手动验证的命令清单。
- 简洁,不堆套话;不确定就问,不要猜着实现。
