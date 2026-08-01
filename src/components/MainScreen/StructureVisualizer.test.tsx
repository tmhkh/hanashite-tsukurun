import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StructureVisualizer } from './StructureVisualizer';

describe('StructureVisualizer', () => {
  it('renders 3 steps', () => {
    render(<StructureVisualizer currentStep={1} completedSteps={[]} />);

    expect(screen.getByLabelText(/ステップ1/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ステップ2/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ステップ3/)).toBeInTheDocument();
  });

  it('displays correct labels: つかみ, なかみ, まとめ', () => {
    render(<StructureVisualizer currentStep={1} completedSteps={[]} />);

    expect(screen.getByText('つかみ')).toBeInTheDocument();
    expect(screen.getByText('なかみ')).toBeInTheDocument();
    expect(screen.getByText('まとめ')).toBeInTheDocument();
  });

  it('displays correct descriptions', () => {
    render(<StructureVisualizer currentStep={1} completedSteps={[]} />);

    expect(screen.getByText('みんなの きょうみを ひく')).toBeInTheDocument();
    expect(screen.getByText('いちばん つたえたい ことを はなす')).toBeInTheDocument();
    expect(screen.getByText('さいごに まとめて つたえる')).toBeInTheDocument();
  });

  it('marks current step as "現在"', () => {
    render(<StructureVisualizer currentStep={2} completedSteps={[1]} />);

    expect(screen.getByLabelText(/ステップ2.*現在/)).toBeInTheDocument();
  });

  it('marks completed steps as "完了"', () => {
    render(<StructureVisualizer currentStep={3} completedSteps={[1, 2]} />);

    expect(screen.getByLabelText(/ステップ1.*完了/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ステップ2.*完了/)).toBeInTheDocument();
  });

  it('marks upcoming steps as "未着手"', () => {
    render(<StructureVisualizer currentStep={1} completedSteps={[]} />);

    expect(screen.getByLabelText(/ステップ2.*未着手/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ステップ3.*未着手/)).toBeInTheDocument();
  });

  it('renders 3 SVG icons (Sparkles, MessageCircle, Flag)', () => {
    const { container } = render(<StructureVisualizer currentStep={1} completedSteps={[]} />);

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(3);
  });

  it('has role="progressbar"', () => {
    render(<StructureVisualizer currentStep={1} completedSteps={[]} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
