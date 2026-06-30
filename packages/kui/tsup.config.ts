import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts', // 全量入口(barrel)
    'src/button/index.ts', // 独立组件入口 → 支持按需(每新增组件同步追加)
    'src/select/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true, // 生成 .d.ts
  splitting: true, // ESM 代码分割,提升复用
  treeshake: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  injectStyle: false, // 关键:输出 .css 文件,不内联进 JS
});
