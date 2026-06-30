import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface UseSelectArgs {
  options: SelectOption[];
  /** 受控:存在即受控,内部 state 不参与渲染。 */
  value?: string;
  /** 非受控初始值。 */
  defaultValue?: string;
  onChange?: (value: string) => void;
}

/**
 * Select 的 Headless 内核:交互状态机 + 键盘 + ARIA + 受控/非受控。
 * 不含任何 DOM 查询;listRef 仅声明、由渲染层挂载。可脱离 DOM 用 renderHook 单测。
 */
export function useSelect({ options, value, defaultValue, onChange }: UseSelectArgs) {
  const isControlled = value !== undefined; // 受控判定:每次渲染按 value 是否存在
  const [inner, setInner] = useState(defaultValue);
  const selected = isControlled ? value : inner; // 读:受控读外部,非受控读内部

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // 原始 options 下标(虚拟焦点)
  const baseId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  // 可用项的原始下标表:移动只在这张表上进行,disabled 天然被跳过
  const enabledIdx = useMemo(
    () => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0),
    [options],
  );

  const commit = useCallback(
    (v: string) => {
      if (!isControlled) setInner(v); // 写:受控时跳过,绝不覆盖外部 value
      onChange?.(v);
      setOpen(false);
    },
    [isControlled, onChange],
  );

  const move = useCallback(
    (dir: 1 | -1 | 'home' | 'end') => {
      setActiveIndex((cur) => {
        if (enabledIdx.length === 0) return -1; // 全 disabled:无可用项
        // noUncheckedIndexedAccess 下索引访问为 T|undefined;length 已守卫,?? -1 仅为满足类型
        const first = enabledIdx[0] ?? -1;
        const last = enabledIdx[enabledIdx.length - 1] ?? -1;
        if (dir === 'home') return first;
        if (dir === 'end') return last;
        const pos = enabledIdx.indexOf(cur);
        if (pos === -1) return dir === 1 ? first : last;
        return enabledIdx[(pos + dir + enabledIdx.length) % enabledIdx.length] ?? -1; // 环绕
      });
    },
    [enabledIdx],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (open) move(1);
          else setOpen(true); // 先开后移:让 listbox 先渲染
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (open) move(-1);
          else setOpen(true);
          break;
        case 'Home':
          e.preventDefault();
          move('home');
          break;
        case 'End':
          e.preventDefault();
          move('end');
          break;
        case 'Enter':
        case ' ': {
          e.preventDefault();
          const opt = open && activeIndex >= 0 ? options[activeIndex] : undefined;
          if (opt) commit(opt.value);
          else setOpen((o) => !o);
          break;
        }
        case 'Escape':
          setOpen(false);
          break;
      }
    },
    [open, activeIndex, options, move, commit],
  );

  // —— prop getters:把状态映射成可拼装的 DOM 属性集 ——
  const getTriggerProps = useCallback(
    () => ({
      role: 'combobox' as const,
      'aria-haspopup': 'listbox' as const,
      'aria-expanded': open,
      // open 守卫:关闭时不指向已卸载的节点
      'aria-controls': open ? `${baseId}-list` : undefined,
      'aria-activedescendant':
        open && activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined,
      onKeyDown,
      onClick: () => setOpen((o) => !o),
    }),
    [open, activeIndex, baseId, onKeyDown],
  );

  const getListProps = useCallback(
    () => ({ id: `${baseId}-list`, role: 'listbox' as const, ref: listRef }),
    [baseId],
  );

  const getOptionProps = useCallback(
    (i: number) => {
      const opt = options[i]; // i 来自渲染层 map,恒有效;opt? 仅为满足类型
      return {
        id: `${baseId}-opt-${i}`,
        role: 'option' as const,
        'aria-selected': opt?.value === selected,
        'aria-disabled': opt?.disabled || undefined,
        onMouseEnter: () => {
          if (opt && !opt.disabled) setActiveIndex(i);
        },
        onClick: () => {
          if (opt && !opt.disabled) commit(opt.value);
        },
      };
    },
    [baseId, options, selected, commit],
  );

  return {
    open,
    setOpen,
    selected,
    activeIndex,
    getTriggerProps,
    getListProps,
    getOptionProps,
  };
}
