import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwitch } from './use-switch';

describe('useSwitch(Headless 内核)', () => {
  it('非受控:defaultChecked 作初值,toggle 更新内部 state', () => {
    const { result } = renderHook(() => useSwitch({ defaultChecked: true }));
    expect(result.current.on).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.on).toBe(false);
  });

  it('非受控:不传 defaultChecked 时默认关', () => {
    const { result } = renderHook(() => useSwitch({}));
    expect(result.current.on).toBe(false);
  });

  it('受控:on 恒等于外部 checked,toggle 不覆盖外部值', () => {
    const onCheckedChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ checked }) => useSwitch({ checked, onCheckedChange }),
      { initialProps: { checked: false } },
    );
    act(() => result.current.toggle());
    // 受控:内部 state 不变,仍读外部;只通过回调请求变更
    expect(result.current.on).toBe(false);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // 外部把 checked 更新后,渲染值才跟随
    rerender({ checked: true });
    expect(result.current.on).toBe(true);
  });

  it('onCheckedChange 入参为变化后的值', () => {
    const onCheckedChange = vi.fn();
    const { result } = renderHook(() =>
      useSwitch({ defaultChecked: false, onCheckedChange }),
    );
    act(() => result.current.toggle());
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    act(() => result.current.toggle());
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it('disabled:toggle 为 no-op,不改 state 也不回调', () => {
    const onCheckedChange = vi.fn();
    const { result } = renderHook(() =>
      useSwitch({ defaultChecked: false, disabled: true, onCheckedChange }),
    );
    act(() => result.current.toggle());
    expect(result.current.on).toBe(false);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('getRootProps:映射 role/aria-checked/aria-disabled', () => {
    const { result } = renderHook(() =>
      useSwitch({ defaultChecked: true, disabled: true }),
    );
    const props = result.current.getRootProps();
    expect(props.role).toBe('switch');
    expect(props.type).toBe('button');
    expect(props['aria-checked']).toBe(true);
    expect(props['aria-disabled']).toBe(true);
    expect(props.disabled).toBe(true);
  });

  it('getRootProps:未禁用时不暴露 aria-disabled', () => {
    const { result } = renderHook(() => useSwitch({}));
    expect(result.current.getRootProps()['aria-disabled']).toBeUndefined();
  });
});
