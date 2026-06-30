# 如何新增一个组件 · 操作手册(Checklist)

> 本文件是 [`docs/impl-guide.md`](impl-guide.md)(**唯一事实源**)的"操作版":把"加一个组件"沉淀成可逐条勾选的步骤,避免漏掉工程硬规则。**有冲突时以 `impl-guide.md` 为准。**
>
> 全程对照三个真实范例:
> - **简单静态组件** → [`packages/kui/src/button`](../packages/kui/src/button)(无交互,只有 cva 变体 + CSS)
> - **中等交互组件** → [`packages/kui/src/switch`](../packages/kui/src/switch)(受控/非受控 + Headless 内核,但渲染仍极薄)
> - **复杂组件** → [`packages/kui/src/select`](../packages/kui/src/select)(状态机 + 键盘 + 虚拟焦点 + ARIA)

下文以新增组件 `Foo`(目录 `foo`、CSS 前缀 `kui-foo`)为例。

---

## Step 0 · 一个决策:要不要 Headless Hook?

| 组件特征 | 要不要 `use-foo.ts` | 范例 |
| --- | --- | --- |
| 纯展示,无内部状态(顶多 cva 变体) | **不要**,渲染层直接出 | `button` |
| 有 open/active/受控/键盘/焦点 等交互 | **要**,逻辑进内核,渲染层只做 `state→DOM` 映射 | `switch`、`select` |

**硬规则**:复杂交互必须沉淀到 Headless Hook,且该 Hook **可脱离 DOM 用 `renderHook` 单测**。渲染层保持极薄,只负责把内核状态拼成 DOM。

---

## Step 1 · 建文件(`packages/kui/src/foo/`)

| 文件 | 作用 | 必需 |
| --- | --- | --- |
| `foo.variants.ts` | cva:`props → className` 纯映射,零运行时 | ✅ |
| `foo.css` | 组件样式,**只消费语义令牌 `var(--*)`,禁裸色值** | ✅ |
| `use-foo.ts` | Headless 内核(受控/键盘/状态机) | 视 Step 0 |
| `foo.tsx` | 渲染层,`forwardRef` + 薄映射 | ✅ |
| `index.ts` | 组件独立入口(barrel) | ✅ |
| `use-foo.test.ts` | Headless 单测(DOM-free) | 视 Step 0 |
| `foo.test.tsx` | render 集成 + **≥1 条 axe** | ✅ |
| `foo.stories.tsx` | Storybook 故事 | ✅ |

### 1.1 `foo.variants.ts`(参照 `switch.variants.ts`)
```ts
import { cva, type VariantProps } from 'class-variance-authority';

export const fooVariants = cva('kui-foo', {
  variants: {
    size: { sm: 'kui-foo--sm', md: 'kui-foo--md', lg: 'kui-foo--lg' },
  },
  defaultVariants: { size: 'md' },
});
export type FooVariants = VariantProps<typeof fooVariants>;
```

### 1.2 `foo.css`(只用令牌变量)
可用的语义令牌见 [`packages/tokens/dist/vars.css`](../packages/tokens/dist/vars.css),例如
`--brand-primary` / `--brand-primary-hover` / `--bg-default` / `--bg-subtle` / `--border-default` / `--text-default` / `--text-on-brand`。
- **几何尺寸(宽高/间距)可写字面量**;**颜色只能用 `var(--*)`**——裸色值会被 Stylelint 判 error。
- 换肤靠切 `data-theme` / `data-brand` 作用域,组件 CSS 无需改动。
- 需要"随主题自适应"的描边/图标,可用 `currentColor`(见 `button.css` 的 spinner)。

### 1.3 `use-foo.ts`(受控/非受控的标准写法,参照 `use-switch.ts`)
```ts
const isControlled = value !== undefined;      // 受控判定:每次渲染按 value 是否存在
const [inner, setInner] = useState(defaultValue);
const current = isControlled ? value : inner;  // 读:受控读外部,非受控读内部

const commit = useCallback((next) => {
  if (!isControlled) setInner(next);           // 写:受控时跳过,绝不覆盖外部 value
  onChange?.(next);
}, [isControlled, onChange]);
```
内核用 **prop getter**(`getRootProps()` / `getTriggerProps()` …)把状态映射成可拼装的 DOM 属性集,渲染层展开即可。

### 1.4 `foo.tsx`(薄渲染层,参照 `switch.tsx`)
```tsx
export const Foo = forwardRef<HTMLButtonElement, FooProps>(
  ({ size, className, ...rest }, ref) => {
    const { getRootProps } = useFoo({ /* ... */ });
    return (
      <button
        ref={ref}
        className={clsx(fooVariants({ size }), className)}
        {...getRootProps()}
        {...rest}
      />
    );
  },
);
Foo.displayName = 'Foo';
```
- **必须** `forwardRef` 到底层原生元素;**必须** `clsx(变体, className)` 合并外部 `className`(不可覆盖变体)。
- 优先复用原生语义元素(如 `<button>`):键盘与焦点天然可达,不要自己在 button 上再挂 `onKeyDown` 重复触发。
- 在 `foo.tsx` 顶部 `import './foo.css';`(配合 `sideEffects` 保证样式不被 tree-shake 掉)。

### 1.5 `index.ts`(独立入口,参照 `switch/index.ts`)
```ts
export { Foo } from './foo';
export type { FooProps } from './foo';
export type { FooVariants } from './foo.variants';
export { useFoo } from './use-foo';          // 有 Headless 才导出
export type { UseFooArgs } from './use-foo';
```

---

## Step 2 · 三处注册(最容易漏的一步)

每个新组件都要在 **3 个地方**登记,缺一会导致"按需入口不存在"或"打不进包":

1. **barrel 全量入口** — [`packages/kui/src/index.ts`](../packages/kui/src/index.ts)
   ```ts
   export * from './foo';
   ```
2. **tsup 独立入口** — [`packages/kui/tsup.config.ts`](../packages/kui/tsup.config.ts) 的 `entry` 数组
   ```ts
   'src/foo/index.ts',
   ```
3. **package.json 条件导出** — [`packages/kui/package.json`](../packages/kui/package.json) 的 `exports`(import/require **各带 `types`**)
   ```jsonc
   "./foo": {
     "import": { "types": "./dist/foo/index.d.ts",  "default": "./dist/foo/index.js"  },
     "require":{ "types": "./dist/foo/index.d.cts", "default": "./dist/foo/index.cjs" }
   }
   ```

> `sideEffects: ["**/*.css"]` 与 `publishConfig.access: "public"` 已在 `package.json` 配好,新增组件无需改动。

---

## Step 3 · 测试(DOD:逻辑优先 + ≥1 条 axe)

- **`use-foo.test.ts`(Headless,DOM-free,用 `renderHook`)**:覆盖边界——
  受控不改内部 state / 非受控更新 / `disabled` no-op / 回调入参正确 / 键盘分支。参照 `use-switch.test.ts`、`use-select.test.ts`。
- **`foo.test.tsx`(render 集成)**:默认 class、变体映射、合并 `className`、`ref` 转发、交互、**axe 无违规**(无文本的组件记得给 `aria-label`,否则 axe 会报缺可访问名)。参照 `switch.test.tsx`。
- 测试用 `@testing-library/react` 的 `fireEvent`(本仓库未引入 `user-event`)。

**门槛**:覆盖率 ≥ 80%(Headless 逻辑优先);axe 0 严重项;键盘可达;ARIA 正确。

---

## Step 4 · Story(参照 `switch.stories.tsx`)
```tsx
const meta: Meta<typeof Foo> = { title: 'Foo', component: Foo, tags: ['autodocs'] };
```
- 至少给 Default / 各变体 / 受控 / 禁用 等典型态。
- **受控故事里若要用 `useState`,必须抽成大写命名的组件**(如 `function ControlledDemo()`)再在 `render` 里渲染——直接在 `render` 闭包里调 hook 会被 `react-hooks/rules-of-hooks` 判 error。

---

## Step 5 · 收尾(每次有意义的变更都做)

1. **写 Changeset**:在 `.changeset/` 新建 `<两三个单词>.md`:
   ```md
   ---
   "@fengnovo/kui": minor
   ---

   新增 Foo 组件:……(一句话人读说明)
   ```
   新增组件用 `minor`;破坏性改动用 `major`;修 bug 用 `patch`。
2. **更新人读 Changelog**:在 [`docs/CHANGELOG.md`](CHANGELOG.md) 的「未发布(Unreleased)」**顶部**追加一条。
3. (重大架构决策才需要)在 [`docs/adr/`](adr/) 追加一条 ADR。

---

## Step 6 · 验收命令(达不到不算完成)

在 `packages/kui/` 下依次跑:
```bash
pnpm typecheck      # TS strict 0 error
pnpm lint           # eslint + stylelint(裸色值=error)0 error
pnpm test           # vitest + axe;覆盖率 ≥ 80%
pnpm build          # 产出 dist/foo/*(js/cjs/d.ts/d.cts/css)
pnpm check:publish  # publint + attw --pack 无 error(node10 已在配置里 ignore)
```
仓库根可跑 `pnpm -w storybook` 在文档站看到 `Foo` 故事;`import '@fengnovo/kui/foo'` 应只打入 Foo(按需 tree-shake)。

---

## 附:DOD 速查(逐条勾)

- [ ] 独立入口 `src/foo/index.ts`,可按需 tree-shake
- [ ] CSS 只消费语义令牌 `var(--*)`,无裸色值
- [ ] 复杂交互沉淀到 Headless Hook,且可脱离 DOM 单测
- [ ] 同时支持受控/非受控,内部 state 不覆盖外部 value
- [ ] 三处注册齐全(barrel / tsup entry / package.json exports 带 `types`)
- [ ] ≥1 条 axe 断言;键盘可达;ARIA 正确
- [ ] 覆盖率 ≥ 80%,Headless 逻辑优先
- [ ] Changeset + `docs/CHANGELOG.md` 各一条
- [ ] typecheck / lint / test / build / check:publish 全过
