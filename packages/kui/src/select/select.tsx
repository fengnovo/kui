import { useEffect, useRef } from 'react';
import { useSelect } from './use-select';
import type { SelectOption } from './use-select';
import './select.css';

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** combobox 必须有可达名称(APG):二选一提供。 */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function Select({
  placeholder = '请选择',
  options,
  value,
  defaultValue,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: SelectProps) {
  const s = useSelect({ options, value, defaultValue, onChange });
  const { open, setOpen } = s;
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === s.selected);

  // 外部 pointerdown 关闭(放渲染层,保持 Headless 内核不含 DOM)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, setOpen]);

  return (
    <div className="kui-select" ref={rootRef}>
      <button
        type="button"
        className="kui-select__trigger"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        {...s.getTriggerProps()}
      >
        <span className={current ? undefined : 'kui-select__placeholder'}>
          {current?.label ?? placeholder}
        </span>
      </button>
      {s.open && (
        <ul className="kui-select__list" {...s.getListProps()}>
          {options.map((o, i) => (
            <li
              key={o.value}
              className="kui-select__option"
              data-active={i === s.activeIndex || undefined}
              data-selected={o.value === s.selected || undefined}
              {...s.getOptionProps(i)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
