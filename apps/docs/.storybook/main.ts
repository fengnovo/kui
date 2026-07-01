import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // 文档站本地 MDX(快速开始等总览页)在前;Story 与组件同目录(packages/kui/src)便于就近维护
  stories: [
    '../docs/**/*.mdx',
    '../../../packages/kui/src/**/*.stories.@(ts|tsx)',
  ],
  // 注:GFM 表格语法(| a | b |)默认不被 MDX 解析,且 addon-docs 的 remark-gfm 选项在 dev/build 表现不一致;
  // 故 MDX 里避免用 markdown 表格,组件清单改用无序列表(见 docs/getting-started.mdx),dev/build 渲染一致。
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  // GitHub Pages 项目页是子路径(/<repo>/),部署时由 docs.yml 注入 STORYBOOK_BASE_PATH;
  // 本地不设该 env → base 保持默认 '/',本地构建/预览不受影响。
  async viteFinal(cfg) {
    if (process.env.STORYBOOK_BASE_PATH) cfg.base = process.env.STORYBOOK_BASE_PATH;
    return cfg;
  },
};

export default config;
