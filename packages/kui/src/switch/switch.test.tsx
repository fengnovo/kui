import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { createRef } from 'react';
import { Switch } from './switch';

describe('Switch · 集成 + a11y', () => {
  it('默认映射到 kui-switch + md,role=switch,初始 unchecked', () => {
    render(<Switch aria-label="开关" />);
    const el = screen.getByRole('switch', { name: '开关' });
    expect(el).toHaveClass('kui-switch', 'kui-switch--md');
    expect(el).toHaveAttribute('aria-checked', 'false');
    expect(el).toHaveAttribute('data-state', 'unchecked');
  });

  it('size 变体映射到对应 class', () => {
    render(<Switch size="lg" aria-label="x" />);
    expect(screen.getByRole('switch')).toHaveClass('kui-switch--lg');
  });

  it('渲染为原生 button(天然键盘可达:Space/Enter 触发 click)', () => {
    render(<Switch aria-label="x" />);
    const el = screen.getByRole('switch');
    expect(el.tagName).toBe('BUTTON');
    expect(el).toHaveAttribute('type', 'button');
  });

  it('非受控:点击切换 aria-checked 与 data-state', () => {
    render(<Switch aria-label="x" />);
    const el = screen.getByRole('switch');
    fireEvent.click(el);
    expect(el).toHaveAttribute('aria-checked', 'true');
    expect(el).toHaveAttribute('data-state', 'checked');
    fireEvent.click(el);
    expect(el).toHaveAttribute('aria-checked', 'false');
  });

  it('onCheckedChange 以变化后的值回调', () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="x" onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('受控:外部 checked 决定显示,点击只回调不自变', () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="x" checked={false} onCheckedChange={onCheckedChange} />);
    const el = screen.getByRole('switch');
    fireEvent.click(el);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(el).toHaveAttribute('aria-checked', 'false'); // 父级没回传 → 不变
  });

  it('disabled:置灰禁用 + aria-disabled,点击不回调', () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="x" disabled onCheckedChange={onCheckedChange} />);
    const el = screen.getByRole('switch');
    expect(el).toBeDisabled();
    expect(el).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(el);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('合并外部 className,不覆盖变体 class', () => {
    render(<Switch aria-label="x" className="my-extra" />);
    expect(screen.getByRole('switch')).toHaveClass('kui-switch--md', 'my-extra');
  });

  it('转发 ref 到原生 button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Switch aria-label="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('axe:开/关两态均无违规', async () => {
    const { container } = render(<Switch aria-label="深色模式" />);
    expect(await axe(container)).toHaveNoViolations(); // 关闭态
    fireEvent.click(screen.getByRole('switch'));
    expect(await axe(container)).toHaveNoViolations(); // 打开态
  });
});
