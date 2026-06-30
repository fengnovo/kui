import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Select } from './select';
import type { SelectOption } from './use-select';

const opts: SelectOption[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', disabled: true },
  { value: 'c', label: 'Cherry' },
];

describe('Select · 集成 + a11y', () => {
  it('16 点击 trigger 开/合 listbox', () => {
    render(<Select options={opts} />);
    const trigger = screen.getByRole('combobox');
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('17 点击 option:选中、关闭、trigger 文案更新', () => {
    render(<Select options={opts} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveTextContent('Cherry');
  });

  it('18 键盘全流程:ArrowDown 开 → ArrowDown 高亮 → Enter 选中', () => {
    const onChange = vi.fn();
    render(<Select options={opts} onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // 开
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // 高亮第一个可用项 (Apple)
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.getByRole('combobox')).toHaveTextContent('Apple');
  });

  it('19 disabled option 点击无效', () => {
    const onChange = vi.fn();
    render(<Select options={opts} onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument(); // 未关闭
  });

  it('20 ARIA 结构正确', () => {
    render(<Select options={opts} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('21 时序:aria-activedescendant 指向真实存在的高亮节点', () => {
    render(<Select options={opts} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // 开
    fireEvent.keyDown(trigger, { key: 'ArrowDown' }); // 高亮 Apple
    const activeId = trigger.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    const activeEl = document.getElementById(activeId as string);
    expect(activeEl).not.toBeNull(); // 指向的 id 真实存在于 DOM
    expect(activeEl).toHaveTextContent('Apple');
    expect(activeEl).toHaveAttribute('data-active');
  });

  it('22 axe:打开态与关闭态均无违规', async () => {
    const { container } = render(<Select options={opts} aria-label="水果" />);
    expect(await axe(container)).toHaveNoViolations(); // 关闭态
    fireEvent.click(screen.getByRole('combobox'));
    expect(await axe(container)).toHaveNoViolations(); // 打开态(listbox/option)
  });

  it('23 受控:外部 value 决定显示,点击只回调不自变', () => {
    const onChange = vi.fn();
    render(<Select options={opts} value="a" onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Apple');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChange).toHaveBeenCalledWith('c');
    expect(screen.getByRole('combobox')).toHaveTextContent('Apple'); // 父级没回传 → 不变
  });

  it('24 外部 pointerdown 关闭列表', () => {
    render(<Select options={opts} aria-label="水果" />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.pointerDown(document.body); // 点击组件外部
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('附:within 作用域查询 listbox 内选项', () => {
    render(<Select options={opts} />);
    fireEvent.click(screen.getByRole('combobox'));
    const list = screen.getByRole('listbox');
    expect(within(list).getByText('Apple')).toBeInTheDocument();
  });
});
