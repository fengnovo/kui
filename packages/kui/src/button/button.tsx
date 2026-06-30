import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { buttonVariants, type ButtonVariants } from './button.variants';
import './button.css';

// Step 4:接上 cva 变体映射(variant/size → className)。
// loading / spinner / aria-busy 与测试、Story 见 Step 5。
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={clsx(buttonVariants({ variant, size }), className)}
      {...rest}
    >
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
