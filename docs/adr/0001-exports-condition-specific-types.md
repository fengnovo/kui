# ADR 0001 · `exports` 采用 condition-specific types

**决策**:`packages/kui` 的 `exports` 每个 JS 入口拆成 `import`/`require` 两个条件,各自带 `types`(`import`→`.d.ts`,`require`→`.d.cts`),不沿用实现指南 §2.2 的扁平单 `types` 写法。

**理由**:扁平写法下 CJS 消费者会把 ESM 风味的 `.d.ts` 当成自己的类型,`attw` 报 `FalseESM`(Masquerading as ESM)、`publint` 告警。而指南自身把 `publint`/`attw` 无 error 列为 Step 2 的 Done 门槛——门槛优先于示例写法。拆条件后 node16(CJS/ESM)与 bundler 全绿。

**附带约定**:`attw` 用 `--profile node16`(不支持 node10 的 legacy resolution,已声明 `engines.node >=18`),并 `--exclude-entrypoints ./styles.css`(CSS 非类型入口),固化在 `packages/kui/.attw.json`。

**环境偏差(记录在案)**:`packageManager` 锁为 `pnpm@10.33.0` 以匹配本机实际版本,非指南示例的 `pnpm@9`;Node 引擎下限 `>=18`。
