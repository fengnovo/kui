import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import './button.css';

// 最小占位实现:仅用于打通 Step 2 的产物管线(.js/.cjs/.d.ts/.css)。
// 真实实现(variants / loading / a11y)见 docs/impl-guide.md Step 4–5。
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...rest }, ref) => (
    <button ref={ref} className={['kui-btn', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
