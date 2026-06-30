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
