import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import { Select } from './select';

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana(禁用)', disabled: true },
  { value: 'cherry', label: 'Cherry' },
];

const meta: Meta<typeof Select> = {
  title: 'Select',
  component: Select,
  tags: ['autodocs'],
  args: { options, 'aria-label': '水果' },
  argTypes: {
    options: {
      description: '选项列表。`disabled: true` 的项在键盘导航时自动跳过。',
      table: { type: { summary: 'SelectOption[]' } },
    },
    value: {
      control: 'text',
      description: '受控值。传入即为受控,内部 state 不参与渲染;需配合 `onChange`。',
      table: { category: '受控', type: { summary: 'string' } },
    },
    defaultValue: {
      control: 'text',
      description: '非受控初始值。',
      table: { category: '非受控', type: { summary: 'string' } },
    },
    onChange: {
      action: 'change',
      description: '选中项变化时回调,入参为选项的 `value`。',
      table: { category: '受控', type: { summary: '(value: string) => void' } },
    },
    placeholder: {
      control: 'text',
      description: '未选择时展示的占位文案。',
      table: { defaultValue: { summary: '请选择' }, type: { summary: 'string' } },
    },
    'aria-label': {
      control: 'text',
      description: 'combobox 可达名称(APG 要求)。与 `aria-labelledby` 二选一。',
      table: { category: '无障碍' },
    },
    'aria-labelledby': {
      control: 'text',
      description: '指向可见标签元素的 id。与 `aria-label` 二选一。',
      table: { category: '无障碍' },
    },
  },
  parameters: {
    docs: {
      description: {
        component: [
          '下拉选择。受控 / 非受控,Headless 内核 + 键盘(方向键 / Home / End / Enter / Esc)+ ARIA;禁用项自动跳过。',
          '',
          '```tsx',
          "import { Select } from '@fengnovo/kui';        // 全量",
          "import { Select } from '@fengnovo/kui/select'; // 按需(推荐)",
          "import '@fengnovo/kui/styles.css';",
          '',
          'const options = [{ value: "apple", label: "Apple" }];',
          '<Select options={options} value={v} onChange={setV} aria-label="水果" />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

/** 非受控:内部维护选中态,只需给初始值(可选)。 */
export const Default: Story = {};

/** 预选中:非受控下用 `defaultValue` 指定初始选项。 */
export const Preselected: Story = {
  args: { defaultValue: 'cherry' },
};

// 受控示例:抽成大写组件,满足 rules-of-hooks
function ControlledDemo(args: ComponentProps<typeof Select>) {
  const [v, setV] = useState('apple');
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Select {...args} value={v} onChange={setV} />
      <span style={{ color: 'var(--text-muted, #666)' }}>
        当前值:<code>{v || '(空)'}</code>
      </span>
    </div>
  );
}

/** 受控:外部持有 `value` + `onChange`,组件不覆盖外部状态。 */
export const Controlled: Story = {
  render: (args) => <ControlledDemo {...args} />,
};
