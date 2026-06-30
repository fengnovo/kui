import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Story 与组件同目录(packages/kui/src),便于就近维护
  stories: ['../../../packages/kui/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
};

export default config;
