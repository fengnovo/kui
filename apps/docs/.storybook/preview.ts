import type { Preview } from '@storybook/react';
// 令牌变量底座(由消费者显式引入 —— 这里就是消费者)
import '@fengnovo/kui-tokens/vars.css';
import '@fengnovo/kui-tokens/theme-dark.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true }, // 背景由 data-theme 令牌驱动,关掉 SB 自带背景
    // 左栏排序:「快速开始」总览页置顶,组件随后
    options: { storySort: { order: ['快速开始', 'Button', 'Select', 'Switch'] } },
  },
  // 工具栏切主题:演示"切 data-theme 即换肤,组件不改"
  globalTypes: {
    theme: {
      description: '主题',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme as string;
      document.body.style.background = 'var(--bg-default)';
      document.body.style.color = 'var(--text-default)';
      return Story();
    },
  ],
};

export default preview;
