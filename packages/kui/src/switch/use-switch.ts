import { useCallback, useState } from 'react';

export interface UseSwitchArgs {
  /** 受控:存在即受控,内部 state 不参与渲染。 */
  checked?: boolean;
  /** 非受控初始值。 */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Switch 的 Headless 内核:受控/非受控开合 + ARIA。
 * 不含任何 DOM 查询;渲染为原生 button,键盘(Space/Enter→click)与焦点由 button 提供,
 * 故内核只负责 toggle 与状态归属。可脱离 DOM 用 renderHook 单测。
 */
export function useSwitch({ checked, defaultChecked, onCheckedChange, disabled }: UseSwitchArgs) {
  const isControlled = checked !== undefined; // 受控判定:每次渲染按 checked 是否存在
  const [inner, setInner] = useState(defaultChecked ?? false);
  const on = isControlled ? checked : inner; // 读:受控读外部,非受控读内部

  const toggle = useCallback(() => {
    if (disabled) return; // 禁用:no-op,不写 state 也不回调
    const next = !on;
    if (!isControlled) setInner(next); // 写:受控时跳过,绝不覆盖外部 checked
    onCheckedChange?.(next);
  }, [disabled, on, isControlled, onCheckedChange]);

  // prop getter:把状态映射成可拼装的根节点(button)属性集
  const getRootProps = useCallback(
    () => ({
      type: 'button' as const,
      role: 'switch' as const,
      'aria-checked': on,
      'aria-disabled': disabled || undefined,
      disabled,
      onClick: toggle,
    }),
    [on, disabled, toggle],
  );

  return { on, toggle, getRootProps };
}
