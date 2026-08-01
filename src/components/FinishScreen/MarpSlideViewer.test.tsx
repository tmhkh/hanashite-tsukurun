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
});
