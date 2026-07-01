import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'Switch',
  component: Switch,
  tags: ['autodocs'],
  args: { 'aria-label': '开关' },
  argTypes: {
    checked: {
      control: 'boolean',
      description: '受控开关状态。传入即为受控;需配合 `onCheckedChange`。',
      table: { category: '受控', type: { summary: 'boolean' } },
    },
    defaultChecked: {
      control: 'boolean',
      description: '非受控初始状态。',
      table: { category: '非受控', type: { summary: 'boolean' } },
    },
    onCheckedChange: {
      action: 'checkedChange',
      description: '状态变化回调,入参为新的开关状态。',
      table: { category: '受控', type: { summary: '(checked: boolean) => void' } },
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: '尺寸。',
      table: { defaultValue: { summary: 'md' }, type: { summary: 'sm | md | lg' } },
    },
    disabled: {
      control: 'boolean',
      description: '禁用态,不可交互。',
      table: { type: { summary: 'boolean' } },
    },
    'aria-label': {
      control: 'text',
      description: 'switch 可达名称。与 `aria-labelledby` 二选一。',
      table: { category: '无障碍' },
    },
  },
  parameters: {
    docs: {
      description: {
        component: [
          '开关组件。受控 / 非受控、`sm / md / lg`、`disabled`;渲染为原生 `<button role="switch">`,键盘可达。',
          '',
          '```tsx',
          "import { Switch } from '@fengnovo/kui';        // 全量",
          "import { Switch } from '@fengnovo/kui/switch'; // 按需(推荐)",
          "import '@fengnovo/kui/styles.css';",
          '',
          '<Switch checked={on} onCheckedChange={setOn} aria-label="深色模式" />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Switch size="sm" aria-label="small" defaultChecked />
      <Switch size="md" aria-label="medium" defaultChecked />
      <Switch size="lg" aria-label="large" defaultChecked />
    </div>
  ),
};

function ControlledDemo() {
  const [on, setOn] = useState(false);
  return (
    <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <Switch checked={on} onCheckedChange={setOn} aria-label="深色模式" />
      <span>{on ? '已开启' : '已关闭'}</span>
    </label>
  );
}

export const Controlled: Story = {
  render: () => <ControlledDemo />,
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Switch disabled aria-label="off-disabled" />
      <Switch disabled defaultChecked aria-label="on-disabled" />
    </div>
  ),
};
