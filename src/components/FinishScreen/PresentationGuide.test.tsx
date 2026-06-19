import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PresentationGuide } from './PresentationGuide';
import type { PresentationGuideEntry } from '../../types';

const mockGuide: PresentationGuideEntry = {
  page: 1,
  script: 'This is a test script for page 1.',
  advice: 'This is test advice for page 1.',
};

describe('PresentationGuide', () => {
  it('script text is displayed', () => {
    render(<PresentationGuide guide={mockGuide} />);
    expect(screen.getByText(mockGuide.script)).toBeInTheDocument();
  });

  it('advice text is displayed', () => {
    render(<PresentationGuide guide={mockGuide} />);
    expect(screen.getByText(mockGuide.advice)).toBeInTheDocument();
  });

  it('has aria-label with page number', () => {
    render(<PresentationGuide guide={mockGuide} />);
    expect(screen.getByLabelText('ページ 1 のガイド')).toBeInTheDocument();
  });

  it('displays section labels', () => {
    render(<PresentationGuide guide={mockGuide} />);
    expect(screen.getByText(/このページで はなすこと/)).toBeInTheDocument();
    expect(screen.getByText(/プレゼンの コツ/)).toBeInTheDocument();
  });
});
