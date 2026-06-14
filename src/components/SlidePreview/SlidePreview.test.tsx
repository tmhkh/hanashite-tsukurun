import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SlidePreview } from './SlidePreview';
import type { SlideData } from '../../types';

describe('SlidePreview', () => {
  const mockSlide: SlideData = {
    step: 1,
    slide_title: 'すきなどうぶつ',
    slide_text: 'ぼくはいぬがすきです',
    image_keyword: 'dog',
  };

  it('3枚分のスライド枠を常時表示する', () => {
    render(
      <SlidePreview slides={[null, null, null]} currentStep={1} loading={false} />
    );

    expect(screen.getByLabelText('スライド 1')).toBeInTheDocument();
    expect(screen.getByLabelText('スライド 2')).toBeInTheDocument();
    expect(screen.getByLabelText('スライド 3')).toBeInTheDocument();
  });

  it('slides 配列の各要素を対応するステップの SlideCard に渡す', () => {
    render(
      <SlidePreview
        slides={[mockSlide, null, null]}
        currentStep={1}
        loading={false}
      />
    );

    // Step 1 にはデータが表示される
    const cards = document.querySelectorAll('.slide-card');
    expect(cards[0]).toHaveAttribute('data-step', '1');
    expect(cards[0].querySelector('.slide-card-title')).toHaveTextContent('すきなどうぶつ');

    // Step 2, 3 はプレースホルダー
    expect(cards[1].querySelector('.slide-card-title')).toHaveTextContent('');
    expect(cards[2].querySelector('.slide-card-title')).toHaveTextContent('');
  });

  it('loading は currentStep に対応するカードにのみ適用される', () => {
    render(
      <SlidePreview slides={[null, null, null]} currentStep={2} loading={true} />
    );

    // Step 2 のみローディング表示
    const cards = document.querySelectorAll('.slide-card');

    // Step 1: ローディングなし
    expect(cards[0].querySelector('.slide-card-loading')).not.toBeInTheDocument();

    // Step 2: ローディングあり
    expect(cards[1].querySelector('.slide-card-loading')).toBeInTheDocument();

    // Step 3: ローディングなし
    expect(cards[2].querySelector('.slide-card-loading')).not.toBeInTheDocument();
  });

  it('loading=false のとき、どのカードにもローディングが表示されない', () => {
    render(
      <SlidePreview slides={[null, null, null]} currentStep={1} loading={false} />
    );

    expect(document.querySelector('.slide-card-loading')).not.toBeInTheDocument();
  });

  it('aria-label がプレビュー領域に設定される', () => {
    render(
      <SlidePreview slides={[null, null, null]} currentStep={1} loading={false} />
    );

    expect(screen.getByLabelText('スライドプレビュー')).toBeInTheDocument();
  });
});
