# 自研组件库实现指南
## 从 0 到 1 落地 · P8/P9 实现版

> 本文是**可执行的实现 Playbook**,不讨论战略/协同/ROI,只讲一件事:**怎么一步步把一个生产级自研组件库做出来。**
> 每个 Step 固定结构:**目标 → 产出 → 关键代码/配置 → 验收点(Done)**。照着顺序做即可落地。
> 包名约定:复用个人 npm scope `@fengnovo`;组件库这一套包用 `kui` 作为统一前缀。主包 `@fengnovo/kui`(React 组件),配套 `@fengnovo/kui-tokens`、`@fengnovo/kui-icons`。**注意 npm scope 不能嵌套**,故 `kui` 只能做包名前缀,不是二级 scope。技术栈在 §0 一次性锁定,后续不再讨论选型。

---

## 0. 技术栈锁定(不再讨论选型)

| 维度 | 选择 | 锁定理由(一句话) |
|---|---|---|
| 包管理 / 编排 | **pnpm + Turborepo** | 严格依赖 + 增量缓存构建 |
| 打包 | **tsup**(JS)+ **tsc/api-extractor**(类型) | esbuild 极速;类型用 api-extractor 产出公共 API 报告做破坏性变更门禁 |
| 模块形态 | **ESM 主 + CJS 兼容 + 独立组件入口** | 现代打包器靠 ESM 静态分析天然按需,免 `babel-plugin-import` |
| 样式 | **Design Token → CSS Variables(主题底座)+ 组件 CSS + cva(变体)** | 零运行时、SSR/RSC 友好、换肤瞬时、可调试 |
| 行为层 | **自研 Headless Hook(状态机式)** | 自研库的核心价值;把交互/无障碍/键盘沉淀进可独立单测的内核 |
| 令牌管线 | **DTCG(W3C)JSON + Style Dictionary 4** | 一份令牌多目标产物(CSS Vars / TS) |
| 测试 | **Vitest + Testing Library + axe + Playwright(E2E+视觉)** | 单元→集成→无障碍→E2E→视觉回归 全链路 |
| 版本/发布 | **Changesets** | monorepo 原子化版本 + 可读变更日志 |
| 文档 | **Storybook 8** | 交互态文档 + 视觉回归一体 |
| CI | **GitHub Actions**(配 `changesets/action` 自动发版) | 托管 Runner 免运维;与 Changesets 的 Version PR 流程原生契合 |

> 升级路线(本期不做,留接口):样式层若要"类型安全的零运行时",可平滑切到 vanilla-extract / Panda;行为层若要跨 Vue,可引入 Zag.js 状态机内核。本文先用最直接、可调试的实现打通全链路。

---

## Step 1 · 工程骨架(Monorepo)

**目标**:建立可增量构建、依赖方向受控的 monorepo。

**产出**:目录结构 + pnpm/turbo/共享 tsconfig+eslint。

### 1.1 目录

```text
fengnovo-kui/                 # GitHub 仓库根(monorepo)
├── packages/
│   ├── tokens/         # @fengnovo/kui-tokens · 设计令牌(DTCG)+ Style Dictionary 产物
│   ├── kui/            # @fengnovo/kui · 组件主包(Headless + 渲染 + 样式)
│   ├── icons/          # @fengnovo/kui-icons · 图标(独立升版本,可后置)
│   ├── tsconfig/       # 内部共享 tsconfig(private,不发布)
│   └── eslint-config/  # 内部共享 lint(private,不发布)
├── apps/
│   └── docs/           # Storybook 文档站(private)
├── e2e/                # Playwright E2E + 视觉回归(private)
├── .changeset/
├── .github/workflows/  # CI / Release(GitHub Actions)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

> **发布 vs 私有**:`@fengnovo/kui` / `@fengnovo/kui-tokens` / `@fengnovo/kui-icons` 发布到公共 npm(与你已有的 `@fengnovo/monitor-sdk` 同 scope);`tsconfig`/`eslint-config`/`docs`/`e2e` 标 `"private": true` 不发布。`@fengnovo/monitor-sdk` 是独立产品,**留在它自己的仓库**,不进本 repo,仅共用 scope。

### 1.2 关键配置

`pnpm-workspace.yaml`
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'e2e'
```

`turbo.json`(Turborepo 2.x,注意是 `tasks` 不是旧版 `pipeline`)
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test":      { "dependsOn": ["^build"] },
    "lint":      {}
  }
}
```

根 `package.json`
```jsonc
{
  "name": "kui",
  "private": true,
  "packageManager": "pnpm@9",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "release": "changeset publish"
  },
  "devDependencies": { "turbo": "^2", "typescript": "^5" }
}
```

`packages/tsconfig/base.json`(各包 extends 它)
```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "verbatimModuleSyntax": true
  }
}
```

**依赖方向硬约束**:`tokens → react`,禁止反向。用 `dependency-cruiser` 在 CI 校验,杜绝环依赖与越层。

**✅ Done**:`pnpm install` 成功;`pnpm build` 空跑通过;`turbo` 缓存生效(第二次 build 命中 cache)。

---

## Step 2 · 构建产物体系(最容易被做错的一步)

**目标**:产出 ESM+CJS 双格式、独立组件入口、正确的 `exports`/`sideEffects`/类型,并**自动校验产物正确性**。

**产出**:`packages/kui` 的 tsup 配置 + package.json + 产物校验。

### 2.1 tsup 配置

`packages/kui/tsup.config.ts`
```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',          // 全量入口(barrel)
    'src/button/index.ts',   // 独立组件入口 → 支持按需
    'src/select/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,                 // 生成 .d.ts
  splitting: true,           // ESM 代码分割,提升复用
  treeshake: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  injectStyle: false,        // 关键:输出 .css 文件,不内联进 JS
});
```

### 2.2 package.json(条件导出 + sideEffects)

`packages/kui/package.json`
```jsonc
{
  "name": "@fengnovo/kui",
  "version": "0.0.0",
  "type": "module",
  "sideEffects": ["**/*.css"],          // 关键:CSS 标记副作用,避免被 tree-shake 摇掉
  "files": ["dist"],
  "publishConfig": { "access": "public" },   // scoped 包默认 restricted,公开发布必须显式声明
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./button": {
      "types": "./dist/button/index.d.ts",
      "import": "./dist/button/index.js",
      "require": "./dist/button/index.cjs"
    },
    "./styles.css": "./dist/index.css"
  },
  "peerDependencies": { "react": ">=18", "react-dom": ">=18" },
  "dependencies": { "class-variance-authority": "^0.7", "clsx": "^2" },
  "devDependencies": { "tsup": "^8", "react": "^18", "react-dom": "^18" }
}
```

> **CSS 消费方式**:消费方在应用入口 `import '@fengnovo/kui/styles.css'` 一次性引入全量样式;组件级 CSS 因 `sideEffects` 配置不会被误删。这是库 CSS 最稳的发布形态。

### 2.3 产物正确性校验(P8/P9 必做)

发布前用两个工具卡住"产物坏了但本地没发现":
```bash
pnpm dlx publint            # 校验 package.json exports/main/module 是否规范
pnpm dlx @arethetypeswrong/cli --pack   # 校验 ESM/CJS 下类型解析是否正确(attw)
```

**✅ Done**:`dist` 同时产出 `.js/.cjs/.d.ts/.css`;`publint` 与 `attw` 无 error;在示例 app 里 `import { Button } from '@fengnovo/kui'` 与 `import { Button } from '@fengnovo/kui/button'` 都能按需打包(后者 bundle 更小)。

---

## Step 3 · 设计令牌管线

**目标**:令牌单一可信源 → 自动产出 CSS Variables + 类型安全 TS 常量。

**产出**:`packages/tokens` 的 DTCG 源 + Style Dictionary 配置 + 产物。

### 3.1 三层令牌(DTCG 格式)

`packages/tokens/src/color.json`
```json
{
  "color": {
    "blue":    { "500": { "$value": "#3b82f6", "$type": "color" } },
    "neutral": { "0":   { "$value": "#ffffff", "$type": "color" },
                 "900": { "$value": "#171717", "$type": "color" } }
  }
}
```

`packages/tokens/src/semantic.json`(语义层:换肤/暗色只改这层)
```json
{
  "brand":  { "primary": { "$value": "{color.blue.500}", "$type": "color" } },
  "bg":     { "default": { "$value": "{color.neutral.0}", "$type": "color" } },
  "text":   { "default": { "$value": "{color.neutral.900}", "$type": "color" } }
}
```

### 3.2 Style Dictionary 4 配置

`packages/tokens/sd.config.mjs`
```js
import StyleDictionary from 'style-dictionary';

export default new StyleDictionary({
  source: ['src/**/*.json'],
  // SD4 自动识别 DTCG($value/$type)
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{ destination: 'vars.css', format: 'css/variables',
                options: { selector: ':root' } }],
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [{ destination: 'tokens.ts', format: 'javascript/es6' }],
    },
  },
});
```

产物 `dist/vars.css`(示例)
```css
:root {
  --color-blue-500: #3b82f6;
  --brand-primary: #3b82f6;
  --bg-default: #ffffff;
  --text-default: #171717;
}
```

### 3.3 暗色 / 多品牌(纯 CSS 变量切作用域,零运行时)

```css
[data-theme="dark"] { --bg-default:#171717; --text-default:#fafafa; }
[data-brand="ops"]  { --brand-primary:#10b981; }
```
切主题 = 改 `document.documentElement.dataset.theme`,浏览器原生重绘,无 JS 序列化样式开销。

**✅ Done**:`node sd.config.mjs` 产出 `vars.css` + `tokens.ts`;`react` 包入口 `import '@fengnovo/kui-tokens/vars.css'`;切 `data-theme` 主题瞬时生效。

---

## Step 4 · 样式落地(CSS Vars + cva)

**目标**:组件样式全部消费语义令牌;变体(variant/size/status)用 `cva` 做"props → className"映射,零运行时。

**产出**:样式约定 + cva 用法范式。

```ts
// packages/kui/src/button/button.variants.ts
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva('kui-btn', {
  variants: {
    variant: { solid: 'kui-btn--solid', outline: 'kui-btn--outline', ghost: 'kui-btn--ghost' },
    size:    { sm: 'kui-btn--sm', md: 'kui-btn--md', lg: 'kui-btn--lg' },
  },
  defaultVariants: { variant: 'solid', size: 'md' },
});
export type ButtonVariants = VariantProps<typeof buttonVariants>;
```

```css
/* packages/kui/src/button/button.css —— 只消费 CSS 变量,不写死颜色 */
.kui-btn {
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: 8px; cursor: pointer;
  font: inherit; transition: background-color .15s, border-color .15s;
}
.kui-btn--solid   { background: var(--brand-primary); color: #fff; }
.kui-btn--outline { background: transparent; border-color: var(--brand-primary); color: var(--brand-primary); }
.kui-btn--sm { height: 28px; padding: 0 12px; }
.kui-btn--md { height: 36px; padding: 0 16px; }
.kui-btn--lg { height: 44px; padding: 0 20px; }
.kui-btn:disabled { opacity: .5; cursor: not-allowed; }
```

**约定(写进团队规范)**:组件 CSS 禁止出现具体色值,只能引用语义令牌变量 → 换肤、暗色、多品牌全部自动生效。

**✅ Done**:任意组件改主题无需改组件代码;`stylelint` 规则禁止裸色值(`color-no-hex` 例外白名单仅令牌包)。

---

## Step 5 · 第一个组件垂直切片(Button)——打通全链路

**目标**:用最简单的组件**跑通"代码 → 样式 → 测试 → 文档 → 产物"整条流水线**。后续组件只是复制这条流水线。

**产出**:Button 的实现 + 测试 + Story。

```tsx
// packages/kui/src/button/button.tsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { buttonVariants, type ButtonVariants } from './button.variants';
import './button.css';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading, disabled, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="kui-btn__spinner" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
```

```ts
// packages/kui/src/button/index.ts   —— 独立入口,支持按需
export { Button, type ButtonProps } from './button';
```

```ts
// packages/kui/src/index.ts          —— barrel 全量入口
export * from './button';
export * from './select';
```

**✅ Done**:`pnpm build` 产出 `dist/button/*`;`import '@fengnovo/kui/button'` 仅打入 Button;Story 可见;单测+axe 通过(见 Step 7)。

> 这一步的意义:**把流水线先打通再铺量**。Button 跑通后,新增组件是"沿着同一条轨道走",而不是每次都重新趟坑。

---

## Step 6 · 复杂组件(Select)——Headless 内核 + 无障碍 + 键盘

**目标**:体现自研库真正的工程深度——把**交互状态、键盘导航、ARIA、受控/非受控**沉淀进一个**可独立单测的 Headless Hook**,渲染层只做映射。

**产出**:`useSelect` 内核(真实代码)+ 渲染层。

### 6.1 Headless 内核

```tsx
// packages/kui/src/select/use-select.ts
import { useId, useRef, useState, useCallback, useMemo } from 'react';

export interface SelectOption { value: string; label: string; disabled?: boolean; }

interface UseSelectArgs {
  options: SelectOption[];
  value?: string;                       // 受控
  defaultValue?: string;                // 非受控
  onChange?: (v: string) => void;
}

export function useSelect({ options, value, defaultValue, onChange }: UseSelectArgs) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const selected = isControlled ? value : inner;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const baseId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const enabledIdx = useMemo(
    () => options.map((o, i) => (o.disabled ? -1 : i)).filter(i => i >= 0),
    [options],
  );

  const commit = useCallback((v: string) => {
    if (!isControlled) setInner(v);
    onChange?.(v);
    setOpen(false);
  }, [isControlled, onChange]);

  const move = useCallback((dir: 1 | -1 | 'home' | 'end') => {
    setActiveIndex(cur => {
      if (dir === 'home') return enabledIdx[0] ?? -1;
      if (dir === 'end')  return enabledIdx[enabledIdx.length - 1] ?? -1;
      const pos = enabledIdx.indexOf(cur);
      const next = pos === -1
        ? (dir === 1 ? enabledIdx[0] : enabledIdx[enabledIdx.length - 1])
        : enabledIdx[(pos + dir + enabledIdx.length) % enabledIdx.length];
      return next ?? -1;
    });
  }, [enabledIdx]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); open ? move(1) : setOpen(true); break;
      case 'ArrowUp':   e.preventDefault(); open ? move(-1) : setOpen(true); break;
      case 'Home':      e.preventDefault(); move('home'); break;
      case 'End':       e.preventDefault(); move('end'); break;
      case 'Enter':
      case ' ':         e.preventDefault();
        if (open && activeIndex >= 0) commit(options[activeIndex].value);
        else setOpen(o => !o);
        break;
      case 'Escape':    setOpen(false); break;
    }
  }, [open, activeIndex, options, move, commit]);

  // —— prop getters:把状态映射成可拼装的 DOM 属性 ——
  const getTriggerProps = () => ({
    role: 'combobox' as const,
    'aria-expanded': open,
    'aria-controls': `${baseId}-list`,
    'aria-activedescendant': activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined,
    onKeyDown,
    onClick: () => setOpen(o => !o),
  });
  const getListProps = () => ({ id: `${baseId}-list`, role: 'listbox' as const, ref: listRef });
  const getOptionProps = (i: number) => ({
    id: `${baseId}-opt-${i}`,
    role: 'option' as const,
    'aria-selected': options[i].value === selected,
    'aria-disabled': options[i].disabled || undefined,
    onMouseEnter: () => !options[i].disabled && setActiveIndex(i),
    onClick: () => !options[i].disabled && commit(options[i].value),
  });

  return { open, setOpen, selected, activeIndex, getTriggerProps, getListProps, getOptionProps };
}
```

### 6.2 渲染层(极薄,只做映射)

```tsx
// packages/kui/src/select/select.tsx
import { useSelect, type SelectOption } from './use-select';
import './select.css';

export interface SelectProps {
  options: SelectOption[];
  value?: string; defaultValue?: string; onChange?: (v: string) => void;
  placeholder?: string;
}

export function Select({ placeholder = '请选择', ...args }: SelectProps) {
  const s = useSelect(args);
  const current = args.options.find(o => o.value === s.selected);
  return (
    <div className="kui-select">
      <button className="kui-select__trigger" {...s.getTriggerProps()}>
        {current?.label ?? placeholder}
      </button>
      {s.open && (
        <ul className="kui-select__list" {...s.getListProps()}>
          {args.options.map((o, i) => (
            <li key={o.value}
                className="kui-select__option"
                data-active={i === s.activeIndex || undefined}
                {...s.getOptionProps(i)}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**为什么这样设计(P8/P9 论据)**
- **行为与渲染解耦**:`useSelect` 不含任何样式/DOM 结构,可脱离 React DOM 直接单测状态(键盘/受控/禁用项跳过),覆盖率与稳定性远高于"整组件测"。
- **Prop Getters 模式**:不暴露内部状态,只暴露"可拼装的属性集",消费方可自由组合 DOM 结构而不破坏无障碍。
- **受控/非受控同时支持**:`value` 存在即受控,这是平台组件库必须正确处理的边界。

**✅ Done**:键盘可全流程操作(上下/Home/End/Enter/Esc);`aria-*` 正确;受控与非受控两种用法均通过测试;axe 无严重项。

---

## Step 7 · 测试体系落地(全链路)

**目标**:单元 → 集成 → 无障碍 → E2E → 视觉回归,关键门槛进 CI。

### 7.1 Vitest(单元 + 集成)

`packages/kui/vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'happy-dom', globals: true, setupFiles: ['./vitest.setup.ts'],
          coverage: { provider: 'v8', thresholds: { lines: 80, functions: 80 } } },
});
```

Headless 单测(纯逻辑,最高价值)
```ts
// use-select.test.ts
import { renderHook, act } from '@testing-library/react';
import { useSelect } from './use-select';

const opts = [{ value:'a',label:'A' }, { value:'b',label:'B',disabled:true }, { value:'c',label:'C' }];

it('ArrowDown 跳过禁用项', () => {
  const { result } = renderHook(() => useSelect({ options: opts }));
  act(() => result.current.setOpen(true));
  act(() => result.current.getTriggerProps().onKeyDown({ key:'ArrowDown', preventDefault(){} } as any));
  act(() => result.current.getTriggerProps().onKeyDown({ key:'ArrowDown', preventDefault(){} } as any));
  expect(result.current.activeIndex).toBe(2); // 跳过了 index 1(disabled)
});
```

集成 + 无障碍(jest-axe)
```ts
// button.test.tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Button } from './button';

it('loading 时禁用且 aria-busy', () => {
  render(<Button loading>提交</Button>);
  expect(screen.getByRole('button')).toBeDisabled();
});
it('无障碍无违规', async () => {
  const { container } = render(<Button>OK</Button>);
  expect(await axe(container)).toHaveNoViolations();
});
```

### 7.2 Playwright(E2E + 视觉回归)

`e2e/playwright.config.ts`
```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  webServer: { command: 'pnpm --filter docs storybook --ci -p 6006', url: 'http://localhost:6006' },
  use: { baseURL: 'http://localhost:6006' },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
});
```

视觉回归(自建快照,免托管成本)
```ts
// e2e/button.visual.spec.ts
import { test, expect } from '@playwright/test';
test('Button 各变体视觉快照', async ({ page }) => {
  await page.goto('/iframe.html?id=button--all-variants');
  await expect(page).toHaveScreenshot('button-variants.png');
});
```
首次跑生成基线快照入库;后续 PR 像素 diff 超阈值即拦截。

**✅ Done**:覆盖率 ≥ 80%;每个组件至少 1 条 axe 断言;关键组件有视觉基线;`pnpm test` + `pnpm e2e` 全绿。

---

## Step 8 · 文档站(Storybook)

**目标**:交互态文档 + 自动 Props 表 + 作为视觉回归的渲染源。

`apps/docs/.storybook/main.ts`
```ts
import type { StorybookConfig } from '@storybook/react-vite';
const config: StorybookConfig = {
  stories: ['../../packages/kui/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
};
export default config;
```

```tsx
// packages/kui/src/button/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
const meta: Meta<typeof Button> = { title: 'Button', component: Button, tags: ['autodocs'] };
export default meta;
export const AllVariants: StoryObj<typeof Button> = {
  render: () => (<>
    <Button variant="solid">Solid</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
  </>),
};
```

`addon-a11y` 让每个 Story 实时跑无障碍检查;`autodocs` 从 TS 类型自动生成 Props 表。文档站两种托管选择:① **GitHub Pages**(零基建,CI 里 `actions/deploy-pages` 一步上线);② 部署到自有 `ui.keen-tech.top`(复用通配子域 + Nginx + acme.sh,CI build 出 `storybook-static` 后 rsync 到服务器)。首期建议先用 GitHub Pages 省事。

**✅ Done**:Storybook 本地可跑;每组件有 Story;Props 表自动生成;a11y 面板无严重项。

---

## Step 9 · 版本与发布流水线(零风险)

**目标**:原子化版本 + 破坏性变更门禁 + Canary 先行 + 秒级回滚。

### 9.1 Changesets

`.changeset/config.json`
```json
{ "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "access": "public", "baseBranch": "main" }
```
> `access: public`:`@fengnovo` 是公开 scope(与 `@fengnovo/monitor-sdk` 一致),scoped 包默认 restricted,必须显式公开。

**GitHub 上的两段式发布流程(由 `changesets/action` 驱动,无需手工发包):**
1. 每个改动 PR 跑 `pnpm changeset` 写一条变更(选 patch/minor/major + 说明),变更文件随 PR 合并进 `main`。
2. 合并到 `main` 后,Release workflow 自动开/更新一个 **"Version Packages" PR**(已升好版本号 + 生成 changelog)。
3. 你 review 并合并这个 Version PR → workflow 自动 `changeset publish` 发布到 npm。**发版动作可审阅、可控,而不是 push 即发。**

### 9.2 破坏性变更门禁(api-extractor)

`packages/kui/api-extractor.json` 产出公共 API 报告 `etc/kui.api.md`,纳入 git。CI 比对:**公共 API 变了但版本未标 major → 直接卡 PR**。把"破坏性"从人工 review 变成机器可检测事件。

### 9.3 GitHub Actions

**① CI(PR / push 校验)** `.github/workflows/ci.yml`
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint && pnpm typecheck
      - run: pnpm build
      - run: pnpm api-extractor run         # 破坏性变更门禁(API 报告比对)
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps && pnpm e2e   # E2E + 视觉回归
```

**② Release(自动开 Version PR / 合并后发布)** `.github/workflows/release.yml`
```yaml
name: Release
on:
  push: { branches: [main] }
concurrency: release-${{ github.ref }}
permissions:
  contents: write          # changesets 开 Version PR / 打 tag
  pull-requests: write
  id-token: write          # npm provenance(OIDC,可信溯源)
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm, registry-url: 'https://registry.npmjs.org' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: changesets/action@v1
        with:
          version: pnpm changeset version    # 有 changeset → 开/更新 "Version Packages" PR
          publish: pnpm release              # Version PR 合并后 → changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}   # Actions 自带
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}         # 你在 npm 生成的 Automation Token
          NPM_CONFIG_PROVENANCE: true                 # 发布带 provenance 溯源
```

**③ Canary(可选,按需手动发预览版)** `.github/workflows/canary.yml`
```yaml
name: Canary
on: { workflow_dispatch: {} }     # 手动触发,或改成 PR 触发
permissions: { id-token: write }
jobs:
  canary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm, registry-url: 'https://registry.npmjs.org' }
      - run: pnpm install --frozen-lockfile && pnpm build
      - run: pnpm changeset version --snapshot canary
      - run: pnpm changeset publish --tag canary --no-git-checks
        env: { NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}, NPM_CONFIG_PROVENANCE: true }
```

**零风险三件套(GitHub 版)**:① CI 里 api-extractor 破坏性变更机器门禁;② Canary 先发 `canary` tag 灰度,验证 OK 再走正式 Release;③ 正式发版经 **Version PR 人工 review** 才 publish,出问题 `npm deprecate` 坏版本 + 业务锁版本,影响面归零。

> **你要在 GitHub/npm 上手动做的(基建交接清单)**:① 建 GitHub 仓库;② 在 npm 生成有 `@fengnovo` 发布权限的 **Automation Token**,加到仓库 `Settings → Secrets → NPM_TOKEN`;③ 给 `main` 开 **branch protection**(必过 CI);④(可选)开 GitHub Pages 给文档站。Actions Runner 是托管的,无需自建。

---

## 实施节奏(Checklist)

按此顺序推进,每步以 Done 为准入下一步:

| 阶段 | Step | 关键 Exit Criteria |
|---|---|---|
| 地基(1–2 周) | Step 1–4 | monorepo 增量构建生效;tsup 双格式产物 `publint`/`attw` 无 error;令牌产出 CSS Vars;换肤生效 |
| 流水线打通(1 周) | Step 5 + Step 7 雏形 | Button 全链路(代码/样式/测试/Story/产物)跑通 |
| 铺量 + 内核(4–5 周) | Step 6 复制流水线铺 P0/P1 组件 | ≥ 20 组件;复杂组件走 Headless;axe 0 严重项;覆盖率 ≥ 80% |
| 质量与发布(1–2 周) | Step 7 补全 + Step 8 + Step 9 | 视觉回归基线入库;Storybook 上线;CI 含破坏性门禁;canary 可发、Version PR 流程跑通 |

> 组件铺量优先级:P0 `Button/Input/Select/Checkbox/Radio/Tooltip/Icon` → P1 `Modal/Drawer/Tabs/Popover/Table/Form/Pagination` → P2 `Toast/Skeleton/Empty/Result`。

---

## 附录

### A. 单组件开发 DOD(Definition of Done)清单

每个组件合并前必须满足:
- [ ] 独立入口导出(`src/<name>/index.ts`),按需可摇树
- [ ] 样式只消费语义令牌变量,无裸色值(stylelint 通过)
- [ ] 复杂交互沉淀到 Headless Hook,可独立单测
- [ ] 单测覆盖受控/非受控、键盘、禁用态;覆盖率达标
- [ ] 至少 1 条 `axe` 无障碍断言通过
- [ ] Story 含全变体,视觉基线入库
- [ ] Props 用 TS 类型(autodocs 可生成文档);有 Changeset 变更说明

### B. 常用命令速查

```bash
pnpm build                       # turbo 增量构建全部包
pnpm --filter @fengnovo/kui build   # 只构建主包
pnpm test && pnpm e2e            # 单元+集成 / E2E+视觉
pnpm changeset                   # 写一条变更
pnpm dlx publint && pnpm dlx @arethetypeswrong/cli --pack  # 发布前产物体检
```

### C. 易踩坑提醒

1. **CSS 被 tree-shake 摇掉** → 必须在 `package.json` 设 `"sideEffects": ["**/*.css"]`。
2. **类型在 CJS 下解析失败** → 用 `attw` 校验;`exports` 里每个入口都要带 `types`。
3. **受控组件丢更新** → `value !== undefined` 判定受控,内部 state 不可覆盖外部 value。
4. **微前端多实例样式冲突** → 类名统一 `kui-` 前缀;后续若上 Module Federation,把 `@fengnovo/kui` 配 shared singleton。
5. **Storybook 与库版本错位** → 文档站作为视觉回归源,必须 `workspace:*` 引用本地包,而非已发布版本。
6. **scoped 包发布报 402/权限错误** → `@fengnovo/*` 默认 restricted,需在每个发布包设 `"publishConfig": { "access": "public" }`(或 changesets `access: public`)。

---

*实现版 v1.0 · 范围:仅自研组件库本体。后续可在同一 Headless + 令牌架构上扩展更复杂组件族,不影响本文落地路径。*
