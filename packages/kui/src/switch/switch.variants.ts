import { cva, type VariantProps } from 'class-variance-authority';

// cva:props → className 的纯映射,零运行时。
// 具体视觉由 switch.css 提供,且只消费语义令牌 var(--*)。
export const switchVariants = cva('kui-switch', {
  variants: {
    size: {
      sm: 'kui-switch--sm',
      md: 'kui-switch--md',
      lg: 'kui-switch--lg',
    },
  },
  defaultVariants: { size: 'md' },
});

export type SwitchVariants = VariantProps<typeof switchVariants>;
