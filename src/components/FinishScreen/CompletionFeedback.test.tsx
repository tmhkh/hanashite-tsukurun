import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CompletionFeedback } from './CompletionFeedback';

describe('CompletionFeedback', () => {
  it('フィードバックテキストを表示する', () => {
    render(<CompletionFeedback feedback="すごくがんばったね！" />);
    expect(screen.getByText('すごくがんばったね！')).toBeInTheDocument();
  });

  it('Star アイコンが表示される', () => {
    const { container } = render(<CompletionFeedback feedback="よくできました！" />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('フィードバックが空文字の場合は何も表示しない', () => {
    const { container } = render(<CompletionFeedback feedback="" />);
    expect(container.firstChild).toBeNull();
  });
});
