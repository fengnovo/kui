import StyleDictionary from 'style-dictionary';

// Style Dictionary 4 自动识别 DTCG($value/$type),无需额外 parser。
// 单一可信源(src/*.json)→ 多目标产物(CSS Variables + TS 常量 + 类型)。

const base = ['src/color.json', 'src/semantic.json'];

// —— 浅色(默认):基础 + 语义 → :root,并产出类型安全 TS 常量 ——
const light = new StyleDictionary({
  source: base,
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        { destination: 'vars.css', format: 'css/variables', options: { selector: ':root' } },
      ],
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [
        { destination: 'tokens.js', format: 'javascript/es6' },
        { destination: 'tokens.d.ts', format: 'typescript/es6-declarations' },
      ],
    },
  },
});

// —— 暗色:只输出语义层覆盖到 [data-theme="dark"] 作用域 ——
// 基础调色板仅用于解析 {color.*} 引用,filter 掉不重复输出;换肤=切作用域,零运行时。
const dark = new StyleDictionary({
  source: ['src/color.json', 'src/semantic.dark.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        {
          destination: 'theme-dark.css',
          format: 'css/variables',
          filter: (token) => token.filePath.endsWith('semantic.dark.json'),
          options: { selector: '[data-theme="dark"]' },
        },
      ],
    },
  },
});

await light.buildAllPlatforms();
await dark.buildAllPlatforms();
