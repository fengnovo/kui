import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { switchVariants, type SwitchVariants } from './switch.variants';
import { useSwitch } from './use-switch';
import './switch.css';

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'>,
    SwitchVariants {
  /** 受控值:存在即受控。 */
  checked?: boolean;
  /** 非受控初始值。 */
  defaultChecked?: boolean;
  /** 开合变化回调,入参为变化后的值。 */
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked, onCheckedChange, disabled, size, className, ...rest }, ref) => {
    const { on, getRootProps } = useSwitch({ checked, defaultChecked, onCheckedChange, disabled });
    return (
      <button
        ref={ref}
        className={clsx(switchVariants({ size }), className)}
        data-state={on ? 'checked' : 'unchecked'}
        {...getRootProps()}
        {...rest}
      >
        <span className="kui-switch__thumb" aria-hidden />
      </button>
    );
  },
);
Switch.displayName = 'Switch';
