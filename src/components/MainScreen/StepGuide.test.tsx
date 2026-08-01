import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StepGuide } from './StepGuide';

describe('StepGuide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows correct message for step 1', () => {
    render(<StepGuide step={1} visible={true} onDismiss={() => {}} />);

    expect(
      screen.getByText("いまのが『つかみ』だよ！みんなが『なんだろう？』っておもう はじめかただね")
    ).toBeInTheDocument();
  });

  it('shows correct message for step 2', () => {
    render(<StepGuide step={2} visible={true} onDismiss={() => {}} />);

    expect(
      screen.getByText("これが『なかみ』！くわしく はなすと みんなに つたわるよ")
    ).toBeInTheDocument();
  });

  it('renders nothing for step 3 (empty message)', () => {
    const { container } = render(<StepGuide step={3} visible={true} onDismiss={() => {}} />);

    expect(container.querySelector('[data-testid="step-guide"]')).not.toBeInTheDocument();
  });

  it('auto-fades after 5000ms and calls onDismiss on transitionend', () => {
    const onDismiss = vi.fn();
    const { container } = render(<StepGuide step={1} visible={true} onDismiss={onDismiss} />);

    const guide = container.querySelector('[data-testid="step-guide"]')!;
    expect(guide).toBeInTheDocument();

    // Before 5000ms, opacity should be 1
    expect(guide).toHaveStyle({ opacity: '1' });

    // After 5000ms, opacity should be 0
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(guide).toHaveStyle({ opacity: '0' });

    // Simulate transitionend event
    act(() => {
      guide.dispatchEvent(new Event('transitionend', { bubbles: true }));
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has opacity 0 when visible is false', () => {
    const { container } = render(<StepGuide step={1} visible={false} onDismiss={() => {}} />);

    const guide = container.querySelector('[data-testid="step-guide"]');
    expect(guide).toHaveStyle({ opacity: '0' });
  });
});
