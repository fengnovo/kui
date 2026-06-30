import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import { Select } from './select';

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'cherry', label: 'Cherry' },
];

const meta: Meta<typeof Select> = {
  title: 'Select',
  component: Select,
  tags: ['autodocs'],
  args: { options, 'aria-label': '水果' },
  parameters: {
    docs: {
      description: {
        component: [
          '下拉选择。受控/非受控,Headless 内核 + 键盘(方向键/Home/End/Enter/Esc)+ ARIA;禁用项自动跳过。',
          '```tsx',
          "import { Select } from '@fengnovo/kui';        // 全量",
          "import { Select } from '@fengnovo/kui/select'; // 按需(推荐)",
          "import '@fengnovo/kui/styles.css';",
          '',
          'const options = [{ value: "a", label: "Apple" }];',
          '<Select options={options} value={v} onChange={setV} aria-label="水果" />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};

// 受控示例:抽成大写组件,满足 rules-of-hooks
function ControlledDemo(args: ComponentProps<typeof Select>) {
  const [v, setV] = useState('apple');
  return <Select {...args} value={v} onChange={setV} />;
}
export const Controlled: Story = {
  render: (args) => <ControlledDemo {...args} />,
};
