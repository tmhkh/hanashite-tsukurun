import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AICharacter } from './AICharacter';

describe('AICharacter', () => {
  it('テキストが空の場合は何も表示しない', () => {
    const { container } = render(<AICharacter text="" isSpeaking={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('テキストがある場合は吹き出しを表示する', () => {
    render(<AICharacter text="こんにちは！" isSpeaking={false} />);
    expect(screen.getByText('こんにちは！')).toBeInTheDocument();
  });

  it('吹き出しのフォントサイズが16px以上である', () => {
    render(<AICharacter text="テスト" isSpeaking={false} />);
    const bubble = screen.getByTestId('ai-bubble');
    const fontSize = parseInt(bubble.style.fontSize, 10);
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  it('aria-live="polite" が設定されている', () => {
    render(<AICharacter text="テスト" isSpeaking={false} />);
    const bubble = screen.getByTestId('ai-bubble');
    expect(bubble).toHaveAttribute('aria-live', 'polite');
  });

  it('isSpeaking=true のときパルスアニメーションが適用される', () => {
    render(<AICharacter text="話し中です" isSpeaking={true} />);
    const bubble = screen.getByTestId('ai-bubble');
    expect(bubble.style.animation).toContain('pulse');
    expect(bubble).toHaveAttribute('data-speaking', 'true');
  });

  it('isSpeaking=false のときアニメーションが適用されない', () => {
    render(<AICharacter text="待機中" isSpeaking={false} />);
    const bubble = screen.getByTestId('ai-bubble');
    expect(bubble.style.animation).toBe('');
    expect(bubble).toHaveAttribute('data-speaking', 'false');
  });
});
