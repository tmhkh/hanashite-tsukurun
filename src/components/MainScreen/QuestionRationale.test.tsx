import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestionRationale } from './QuestionRationale';

describe('QuestionRationale', () => {
  it('shows correct message for step 1', () => {
    render(<QuestionRationale step={1} visible={true} onToggle={() => {}} />);

    expect(
      screen.getByText('テーマを はっきり させると、みんなに つたわりやすくなるよ')
    ).toBeInTheDocument();
  });

  it('shows correct message for step 2', () => {
    render(<QuestionRationale step={2} visible={true} onToggle={() => {}} />);

    expect(
      screen.getByText('くわしく はなすと、きいてる ひとが イメージ しやすくなるよ')
    ).toBeInTheDocument();
  });

  it('shows correct message for step 3', () => {
    render(<QuestionRationale step={3} visible={true} onToggle={() => {}} />);

    expect(
      screen.getByText('さいごに きもちを つたえると、みんなの こころに のこるよ')
    ).toBeInTheDocument();
  });

  it('hides the message when visible is false', () => {
    render(<QuestionRationale step={1} visible={false} onToggle={() => {}} />);

    expect(
      screen.queryByText('テーマを はっきり させると、みんなに つたわりやすくなるよ')
    ).not.toBeInTheDocument();
  });

  it('shows toggle button when visible is false', () => {
    render(<QuestionRationale step={1} visible={false} onToggle={() => {}} />);

    expect(screen.getByLabelText('ヒントを みる')).toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn();
    render(<QuestionRationale step={1} visible={true} onToggle={onToggle} />);

    fireEvent.click(screen.getByLabelText('ヒントを かくす'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has data-testid="question-rationale"', () => {
    render(<QuestionRationale step={1} visible={true} onToggle={() => {}} />);

    expect(screen.getByTestId('question-rationale')).toBeInTheDocument();
  });
});
