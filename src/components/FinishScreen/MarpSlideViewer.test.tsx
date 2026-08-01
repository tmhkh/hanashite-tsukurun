import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MarpSlideViewer } from './MarpSlideViewer';

const mockMarkdown = `---
marp: true
theme: default
paginate: true
---

# Page 1

Content of page 1

---

# Page 2

Content of page 2

---

# Page 3

Content of page 3`;

describe('MarpSlideViewer', () => {
  it('renders navigation buttons', () => {
    render(
      <MarpSlideViewer markdown={mockMarkdown} currentPage={0} onPageChange={() => {}} />
    );
    expect(screen.getByLabelText('前のスライド')).toBeInTheDocument();
    expect(screen.getByLabelText('次のスライド')).toBeInTheDocument();
  });

  it('displays page indicator', () => {
    render(
      <MarpSlideViewer markdown={mockMarkdown} currentPage={0} onPageChange={() => {}} />
    );
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('prev button is disabled on first page', () => {
    render(
      <MarpSlideViewer markdown={mockMarkdown} currentPage={0} onPageChange={() => {}} />
    );
    const prevBtn = screen.getByLabelText('前のスライド');
    expect(prevBtn).toBeDisabled();
  });

  it('next button is disabled on last page', () => {
    render(
      <MarpSlideViewer markdown={mockMarkdown} currentPage={2} onPageChange={() => {}} />
    );
    const nextBtn = screen.getByLabelText('次のスライド');
    expect(nextBtn).toBeDisabled();
  });

  it('calls onPageChange when next is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <MarpSlideViewer markdown={mockMarkdown} currentPage={0} onPageChange={onPageChange} />
    );
    await user.click(screen.getByLabelText('次のスライド'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange when prev is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <MarpSlideViewer markdown={mockMarkdown} currentPage={1} onPageChange={onPageChange} />
    );
    await user.click(screen.getByLabelText('前のスライド'));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it('スライド要素にアニメーションクラスが適用される', () => {
    const { container } = render(
      <MarpSlideViewer markdown={mockMarkdown} currentPage={0} onPageChange={() => {}} />
    );
    expect(container.querySelector('.slide-title')).toBeInTheDocument();
    expect(container.querySelector('.slide-text')).toBeInTheDocument();
  });

  it('ページ遷移時にトランジションクラスが適用される', () => {
    const { container } = render(
      <MarpSlideViewer markdown={mockMarkdown} currentPage={0} onPageChange={() => {}} />
    );
    // 初期状態では forward (slide-page-enter)
    expect(container.querySelector('.slide-page-enter')).toBeInTheDocument();
  });

  it('renders .slide-icon class when icon is present', () => {
    const markdownWithIcon = `---
marp: true
theme: default
---

# Animal Page

I like dogs

<!-- icon: dog -->`;

    const { container } = render(
      <MarpSlideViewer markdown={markdownWithIcon} currentPage={0} onPageChange={() => {}} />
    );
    expect(container.querySelector('.slide-icon')).toBeInTheDocument();
  });

  it('does not render .slide-icon when no icon is specified', () => {
    const markdownNoIcon = `---
marp: true
theme: default
---

# No Icon Page

Just some text`;

    const { container } = render(
      <MarpSlideViewer markdown={markdownNoIcon} currentPage={0} onPageChange={() => {}} />
    );
    expect(container.querySelector('.slide-icon')).not.toBeInTheDocument();
  });

  it('strips HTML comment directives from body text', () => {
    const markdownWithDirective = `---
marp: true
theme: default
---

# Title

<!-- _class: lead -->
Some content`;

    render(
      <MarpSlideViewer markdown={markdownWithDirective} currentPage={0} onPageChange={() => {}} />
    );
    // The directive should not appear in the rendered output
    expect(screen.queryByText(/<!-- _class/)).not.toBeInTheDocument();
    expect(screen.getByText('Some content')).toBeInTheDocument();
  });

  it('strips bold markers from body text', () => {
    const markdownWithBold = `---
marp: true
theme: default
---

# Title

ぼくは **いぬ** がすきです`;

    render(
      <MarpSlideViewer markdown={markdownWithBold} currentPage={0} onPageChange={() => {}} />
    );
    expect(screen.getByText('ぼくは いぬ がすきです')).toBeInTheDocument();
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it('renders blockquote lines without the > prefix', () => {
    const markdownWithBlockquote = `---
marp: true
theme: default
---

# Title

> ふわふわで かわいいんだよ！`;

    render(
      <MarpSlideViewer markdown={markdownWithBlockquote} currentPage={0} onPageChange={() => {}} />
    );
    expect(screen.getByText('ふわふわで かわいいんだよ！')).toBeInTheDocument();
    expect(screen.queryByText(/^>/)).not.toBeInTheDocument();
  });
});
