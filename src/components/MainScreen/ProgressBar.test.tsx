import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('renders 3 steps', () => {
    render(<ProgressBar currentStep={1} completedSteps={[]} />);

    expect(screen.getByLabelText(/ステップ1/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ステップ2/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ステップ3/)).toBeInTheDocument();
  });

  it('marks current step as "現在"', () => {
    render(<ProgressBar currentStep={2} completedSteps={[1]} />);

    expect(screen.getByLabelText(/ステップ2.*現在/)).toBeInTheDocument();
  });

  it('marks completed steps as "完了"', () => {
    render(<ProgressBar currentStep={3} completedSteps={[1, 2]} />);

    expect(screen.getByLabelText(/ステップ1.*完了/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ステップ2.*完了/)).toBeInTheDocument();
  });

  it('marks upcoming steps as "未着手"', () => {
    render(<ProgressBar currentStep={1} completedSteps={[]} />);

    expect(screen.getByLabelText(/ステップ2.*未着手/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ステップ3.*未着手/)).toBeInTheDocument();
  });

  it('displays step labels: タイトル, なかみ, まとめ', () => {
    render(<ProgressBar currentStep={1} completedSteps={[]} />);

    expect(screen.getByText('タイトル')).toBeInTheDocument();
    expect(screen.getByText('なかみ')).toBeInTheDocument();
    expect(screen.getByText('まとめ')).toBeInTheDocument();
  });

  it('shows completed icon (checkmark) for completed steps', () => {
    const { container } = render(<ProgressBar currentStep={3} completedSteps={[1, 2]} />);

    // Lucide Check icon renders as SVG
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(2); // Two completed steps should have check icons
  });

  it('shows step number for non-completed steps', () => {
    render(<ProgressBar currentStep={1} completedSteps={[]} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
