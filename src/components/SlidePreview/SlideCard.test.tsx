import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SlideCard } from './SlideCard';
import type { SlideData } from '../../types';

describe('SlideCard', () => {
  const mockData: SlideData = {
    step: 1,
    slide_title: 'すきなどうぶつ',
    slide_text: 'ぼくはいぬがすきです',
    image_keyword: 'dog',
  };

  it('data=null のとき空欄とアイコンプレースホルダーを表示する', () => {
    render(<SlideCard step={1} data={null} loading={false} />);

    // タイトル・テキストは空
    const title = document.querySelector('.slide-card-title');
    expect(title).toHaveTextContent('');

    const text = document.querySelector('.slide-card-text');
    expect(text).toHaveTextContent('');

    // プレースホルダーアイコンが表示される
    expect(screen.getByLabelText('アイコンプレースホルダー')).toBeInTheDocument();
  });

  it('loading=true のときローディングインジケーターを表示する', () => {
    render(<SlideCard step={2} data={null} loading={true} />);

    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument();
    expect(document.querySelector('.slide-card-spinner')).toBeInTheDocument();
  });

  it('data が有るとき slide_title・slide_text・SlideIcon を表示する', () => {
    render(<SlideCard step={1} data={mockData} loading={false} />);

    // タイトル表示
    const title = document.querySelector('.slide-card-title');
    expect(title).toHaveTextContent('すきなどうぶつ');

    // テキスト表示
    const text = document.querySelector('.slide-card-text');
    expect(text).toHaveTextContent('ぼくはいぬがすきです');

    // SlideIcon が描画される（keyword="dog" → aria-label="dog"）
    expect(screen.getByLabelText('dog')).toBeInTheDocument();

    // プレースホルダーは表示されない
    expect(screen.queryByLabelText('アイコンプレースホルダー')).not.toBeInTheDocument();
  });

  it('loading=true かつ data 有りの場合、スライド内容とローディングの両方を表示する', () => {
    render(<SlideCard step={3} data={mockData} loading={true} />);

    // ローディングインジケーター表示
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument();

    // データも裏に表示されている
    const title = document.querySelector('.slide-card-title');
    expect(title).toHaveTextContent('すきなどうぶつ');
  });

  it('step 属性が data-step として設定される', () => {
    render(<SlideCard step={2} data={null} loading={false} />);

    const card = document.querySelector('.slide-card');
    expect(card).toHaveAttribute('data-step', '2');
  });

  it('aria-label にステップ番号が含まれる', () => {
    render(<SlideCard step={3} data={null} loading={false} />);

    expect(screen.getByLabelText('スライド 3')).toBeInTheDocument();
  });
});
