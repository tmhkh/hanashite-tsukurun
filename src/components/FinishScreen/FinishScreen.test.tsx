import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FinishScreen } from './FinishScreen';
import type { PresentationGuideEntry } from '../../types';

const mockMarpMarkdown = `---
marp: true
theme: default
paginate: true
---

# すきなどうぶつ

ぼくはいぬがすきです

<!-- icon: dog -->

---

# いちばん すきなところ

なでるとふわふわでかわいい

<!-- icon: heart -->

---

# まとめ

いぬはともだちです

<!-- icon: star -->`;

const mockPresentationGuide: PresentationGuideEntry[] = [
  {
    page: 1,
    script: 'みなさん、こんにちは。きょうは ぼくの すきな どうぶつについて おはなしします。',
    advice: 'さいしょに テーマを つたえよう。',
  },
  {
    page: 2,
    script: 'ぼくが いちばん すきなところは、ふわふわで かわいいところです。',
    advice: 'くわしく はなそう。',
  },
  {
    page: 3,
    script: 'いぬは ぼくの だいすきな ともだちです。',
    advice: 'きもちで しめよう。',
  },
];

describe('FinishScreen', () => {
  it('完成メッセージを表示する', () => {
    render(
      <FinishScreen
        marpMarkdown={mockMarpMarkdown}
        presentationGuide={mockPresentationGuide}
        completionFeedback=""
        onRestart={() => {}}
      />
    );

    expect(screen.getByText(/スライドが できたよ/)).toBeInTheDocument();
  });

  it('ページナビゲーションボタンを表示する', () => {
    render(
      <FinishScreen
        marpMarkdown={mockMarpMarkdown}
        presentationGuide={mockPresentationGuide}
        completionFeedback=""
        onRestart={() => {}}
      />
    );

    expect(screen.getByLabelText('前のスライド')).toBeInTheDocument();
    expect(screen.getByLabelText('次のスライド')).toBeInTheDocument();
  });

  it('最初のページのpresentation_guideを表示する', () => {
    render(
      <FinishScreen
        marpMarkdown={mockMarpMarkdown}
        presentationGuide={mockPresentationGuide}
        completionFeedback=""
        onRestart={() => {}}
      />
    );

    expect(screen.getByText(mockPresentationGuide[0].script)).toBeInTheDocument();
    expect(screen.getByText(mockPresentationGuide[0].advice)).toBeInTheDocument();
  });

  it('「もう一度つくる」ボタンを表示し、クリック時に onRestart を呼び出す', async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(
      <FinishScreen
        marpMarkdown={mockMarpMarkdown}
        presentationGuide={mockPresentationGuide}
        completionFeedback=""
        onRestart={onRestart}
      />
    );

    const button = screen.getByText('もう一度つくる');
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('コピーボタンを表示する', () => {
    render(
      <FinishScreen
        marpMarkdown={mockMarpMarkdown}
        presentationGuide={mockPresentationGuide}
        completionFeedback=""
        onRestart={() => {}}
      />
    );

    expect(screen.getByLabelText('スライドのMarkdownをコピー')).toBeInTheDocument();
  });

  it('ボタンのフォントサイズが16px以上である', () => {
    render(
      <FinishScreen
        marpMarkdown={mockMarpMarkdown}
        presentationGuide={mockPresentationGuide}
        completionFeedback=""
        onRestart={() => {}}
      />
    );

    const button = screen.getByText('もう一度つくる');
    expect(button).toHaveStyle({ fontSize: '18px' });
  });
});
