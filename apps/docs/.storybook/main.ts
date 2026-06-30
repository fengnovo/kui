import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Story 与组件同目录(packages/kui/src),便于就近维护
  stories: ['../../../packages/kui/src/**/*.stories.@(ts|tsx)'],
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
