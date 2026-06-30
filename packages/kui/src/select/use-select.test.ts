import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelect, type SelectOption } from './use-select';

const opts: SelectOption[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
  { value: 'c', label: 'C' },
];

// 喂一个最小假事件,验证纯逻辑(无 DOM)
const press = (result: { current: ReturnType<typeof useSelect> }, key: string) =>
  act(() => result.current.getTriggerProps().onKeyDown({ key, preventDefault() {} } as never));

describe('useSelect · Headless 纯逻辑', () => {
  it('A1 初始态', () => {
    const { result } = renderHook(() => useSelect({ options: opts, defaultValue: 'a' }));
    expect(result.current.open).toBe(false);
    expect(result.current.activeIndex).toBe(-1);
    expect(result.current.selected).toBe('a');
  });

  it('A2 ArrowDown(关闭态)只开、不移动', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    press(result, 'ArrowDown');
    expect(result.current.open).toBe(true);
    expect(result.current.activeIndex).toBe(-1);
  });

  it('A3 ArrowDown(打开态)落到第一个可用项', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    act(() => result.current.setOpen(true));
    press(result, 'ArrowDown');
    expect(result.current.activeIndex).toBe(0);
  });

  it('A4 连续 ArrowDown 跳过 disabled(0 → 2)', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    act(() => result.current.setOpen(true));
    press(result, 'ArrowDown');
    press(result, 'ArrowDown');
    expect(result.current.activeIndex).toBe(2);
  });

  it('A5 首项 disabled 时 ArrowDown 不落在 0', () => {
    const o: SelectOption[] = [
      { value: 'a', label: 'A', disabled: true },
      { value: 'b', label: 'B' },
    ];
    const { result } = renderHook(() => useSelect({ options: o }));
    act(() => result.current.setOpen(true));
    press(result, 'ArrowDown');
    expect(result.current.activeIndex).toBe(1);
  });

  it('A6 ArrowUp 从首个可用项环绕到末个可用项', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    act(() => result.current.setOpen(true));
    press(result, 'ArrowDown'); // → 0
    press(result, 'ArrowUp'); // 环绕 → 2(跳过 disabled 1)
    expect(result.current.activeIndex).toBe(2);
  });

  it('A7 Home / End 命中首尾可用项', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    act(() => result.current.setOpen(true));
    press(result, 'End');
    expect(result.current.activeIndex).toBe(2);
    press(result, 'Home');
    expect(result.current.activeIndex).toBe(0);
  });

  it('A8 全 disabled 时 activeIndex 恒 -1', () => {
    const o: SelectOption[] = [
      { value: 'a', label: 'A', disabled: true },
      { value: 'b', label: 'B', disabled: true },
    ];
    const { result } = renderHook(() => useSelect({ options: o }));
    act(() => result.current.setOpen(true));
    press(result, 'ArrowDown');
    press(result, 'End');
    expect(result.current.activeIndex).toBe(-1);
  });

  it('A9 Enter 提交(非受控):selected 更新、关闭、onChange', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelect({ options: opts, onChange }));
    act(() => result.current.setOpen(true));
    press(result, 'ArrowDown'); // active = 0 (a)
    press(result, 'Enter');
    expect(result.current.selected).toBe('a');
    expect(result.current.open).toBe(false);
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('A10 Space 等同 Enter', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    act(() => result.current.setOpen(true));
    press(result, 'ArrowDown'); // active = 0
    press(result, ' ');
    expect(result.current.selected).toBe('a');
    expect(result.current.open).toBe(false);
  });

  it('A16 ArrowUp(关闭态)只开', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    press(result, 'ArrowUp');
    expect(result.current.open).toBe(true);
    expect(result.current.activeIndex).toBe(-1);
  });

  it('A17 Enter(关闭态)切换打开', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    press(result, 'Enter');
    expect(result.current.open).toBe(true);
  });

  it('A11 Escape 关闭', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    act(() => result.current.setOpen(true));
    press(result, 'Escape');
    expect(result.current.open).toBe(false);
  });

  it('A12 受控:commit 不覆盖外部 value,但 onChange 被调用', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelect({ options: opts, value: 'a', onChange }));
    act(() => result.current.getOptionProps(2).onClick()); // 点 C
    expect(result.current.selected).toBe('a'); // 内部不动
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('A13 非受控:commit 更新 selected', () => {
    const { result } = renderHook(() => useSelect({ options: opts, defaultValue: 'a' }));
    act(() => result.current.getOptionProps(2).onClick());
    expect(result.current.selected).toBe('c');
  });

  it('A14 getTriggerProps:open 守卫 aria-activedescendant / aria-controls', () => {
    const { result } = renderHook(() => useSelect({ options: opts }));
    // 关闭态
    expect(result.current.getTriggerProps()['aria-expanded']).toBe(false);
    expect(result.current.getTriggerProps()['aria-controls']).toBeUndefined();
    expect(result.current.getTriggerProps()['aria-activedescendant']).toBeUndefined();
    // 打开并高亮
    act(() => result.current.setOpen(true));
    press(result, 'ArrowDown'); // active = 0
    const p = result.current.getTriggerProps();
    expect(p['aria-expanded']).toBe(true);
    expect(p['aria-controls']).toBeTruthy();
    expect(p['aria-activedescendant']).toMatch(/-opt-0$/);
  });

  it('A15 getOptionProps:aria-selected / disabled 项不可交互', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useSelect({ options: opts, defaultValue: 'a', onChange }),
    );
    expect(result.current.getOptionProps(0)['aria-selected']).toBe(true);
    expect(result.current.getOptionProps(2)['aria-selected']).toBe(false);
    expect(result.current.getOptionProps(1)['aria-disabled']).toBe(true);
    // disabled 项点击不提交、hover 不改 active
    act(() => result.current.setOpen(true));
    act(() => result.current.getOptionProps(1).onMouseEnter());
    expect(result.current.activeIndex).toBe(-1);
    act(() => result.current.getOptionProps(1).onClick());
    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.open).toBe(true);
  });
});
