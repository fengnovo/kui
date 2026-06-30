import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          '按钮组件。`solid/outline/ghost` × `sm/md/lg`,支持 `loading`(置灰禁用 + spinner + `aria-busy`)。',
          '```tsx',
          "import { Button } from '@fengnovo/kui';        // 全量",
          "import { Button } from '@fengnovo/kui/button'; // 按需(推荐)",
          "import '@fengnovo/kui/styles.css';",
          '',
          '<Button variant="solid" size="md">确定</Button>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Solid: Story = { args: { children: 'Solid', variant: 'solid' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button variant="solid">Solid</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Loading: Story = { args: { children: '提交', loading: true } };
