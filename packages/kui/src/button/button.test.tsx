import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { createRef } from 'react';
import { Button } from './button';

describe('Button', () => {
  it('默认映射到 solid + md class', () => {
    render(<Button>OK</Button>);
    const btn = screen.getByRole('button', { name: 'OK' });
    expect(btn).toHaveClass('kui-btn', 'kui-btn--solid', 'kui-btn--md');
  });

  it('variant / size 映射到对应 class', () => {
    render(
      <Button variant="outline" size="lg">
        X
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('kui-btn--outline', 'kui-btn--lg');
  });

  it('合并外部 className,不覆盖变体 class', () => {
    render(<Button className="my-extra">X</Button>);
    expect(screen.getByRole('button')).toHaveClass('kui-btn--solid', 'my-extra');
  });

  it('loading:置灰禁用 + aria-busy + 渲染 spinner', () => {
    render(<Button loading>提交</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('.kui-btn__spinner')).not.toBeNull();
  });

  it('未 loading 时不暴露 aria-busy、不渲染 spinner', () => {
    render(<Button>X</Button>);
    const btn = screen.getByRole('button');
    expect(btn).not.toHaveAttribute('aria-busy');
    expect(btn.querySelector('.kui-btn__spinner')).toBeNull();
  });

  it('disabled 透传', () => {
    render(<Button disabled>X</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('转发 ref 到原生 button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>X</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('透传原生 props(onClick / type)', async () => {
    const onClick = vi.fn();
    render(
      <Button type="submit" onClick={onClick}>
        Go
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('type', 'submit');
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('loading 时点击不触发 onClick(已禁用)', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Go
      </Button>,
    );
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('无障碍:无违规', async () => {
    const { container } = render(<Button>OK</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
