import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FinishScreen } from './FinishScreen';
import type { SlideData } from '../../types';

const mockSlides: SlideData[] = [
  { step: 1, slide_title: 'すきなどうぶつ', slide_text: 'ぼくはいぬがすきです', image_keyword: 'dog' },
  { step: 2, slide_title: 'どんなところがすき？', slide_text: 'なでるとふわふわでかわいい', image_keyword: 'heart' },
  { step: 3, slide_title: 'まとめ', slide_text: 'いぬはともだちです', image_keyword: 'star' },
];

const mockScript = 'わたしはいぬがすきです。いぬはふわふわしていてなでるとかわいいです。いぬはわたしのだいすきなともだちです。';

describe('FinishScreen', () => {
  it('3枚のスライドを横並びで表示する', () => {
    render(<FinishScreen slides={mockSlides} script={mockScript} onRestart={() => {}} />);

    expect(screen.getByLabelText('スライド 1')).toBeInTheDocument();
    expect(screen.getByLabelText('スライド 2')).toBeInTheDocument();
    expect(screen.getByLabelText('スライド 3')).toBeInTheDocument();
  });

  it('各スライドの slide_title と slide_text を表示する', () => {
    render(<FinishScreen slides={mockSlides} script={mockScript} onRestart={() => {}} />);

    expect(screen.getByText('すきなどうぶつ')).toBeInTheDocument();
    expect(screen.getByText('ぼくはいぬがすきです')).toBeInTheDocument();
    expect(screen.getByText('どんなところがすき？')).toBeInTheDocument();
    expect(screen.getByText('なでるとふわふわでかわいい')).toBeInTheDocument();
    expect(screen.getByText('まとめ')).toBeInTheDocument();
    expect(screen.getByText('いぬはともだちです')).toBeInTheDocument();
  });

  it('Step 1・2・3 のラベルを表示する', () => {
    render(<FinishScreen slides={mockSlides} script={mockScript} onRestart={() => {}} />);

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('script の内容を台本エリアに表示する', () => {
    render(<FinishScreen slides={mockSlides} script={mockScript} onRestart={() => {}} />);

    expect(screen.getByLabelText('発表台本')).toBeInTheDocument();
    expect(screen.getByText(mockScript)).toBeInTheDocument();
  });

  it('「もう一度つくる」ボタンを表示し、クリック時に onRestart を呼び出す', async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(<FinishScreen slides={mockSlides} script={mockScript} onRestart={onRestart} />);

    const button = screen.getByText('もう一度つくる');
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('ボタンのフォントサイズが16px以上である', () => {
    render(<FinishScreen slides={mockSlides} script={mockScript} onRestart={() => {}} />);

    const button = screen.getByText('もう一度つくる');
    expect(button).toHaveStyle({ fontSize: '18px' });
  });
});
