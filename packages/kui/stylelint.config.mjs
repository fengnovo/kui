/**
 * 组件包样式硬规则:禁裸色值。
 * 颜色一律走语义令牌变量 var(--*);hex / 命名色一律视为 error。
 * 令牌包(packages/tokens)是色值唯一来源,不挂这套规则。
 * @type {import('stylelint').Config}
 */
export default {
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
  },
};
