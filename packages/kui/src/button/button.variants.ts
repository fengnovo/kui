import { cva, type VariantProps } from 'class-variance-authority';

// cva:props → className 的纯映射,零运行时。
// 具体视觉由 button.css 提供,且只消费语义令牌 var(--*)。
export const buttonVariants = cva('kui-btn', {
  variants: {
    variant: {
      solid: 'kui-btn--solid',
      outline: 'kui-btn--outline',
      ghost: 'kui-btn--ghost',
    },
    size: {
      sm: 'kui-btn--sm',
      md: 'kui-btn--md',
      lg: 'kui-btn--lg',
    },
  },
  defaultVariants: { variant: 'solid', size: 'md' },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;
