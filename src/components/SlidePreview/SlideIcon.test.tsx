import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SlideIcon } from './SlideIcon';

describe('SlideIcon', () => {
  it('renders a known icon for a valid keyword (e.g. "dog" → Dog)', () => {
    const { container } = render(<SlideIcon keyword="dog" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label', 'dog');
  });

  it('renders Star icon for an unknown keyword', () => {
    const { container } = render(<SlideIcon keyword="nonexistent-xyz" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label', 'nonexistent-xyz');
  });

  it('renders Star icon for an empty string keyword', () => {
    const { container } = render(<SlideIcon keyword="" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label', 'star');
  });

  it('converts hyphenated keywords to PascalCase (e.g. "file-text" → FileText)', () => {
    const { container } = render(<SlideIcon keyword="file-text" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies the size prop to the rendered SVG', () => {
    const { container } = render(<SlideIcon keyword="heart" size={64} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('uses default size of 48 when size prop is not provided', () => {
    const { container } = render(<SlideIcon keyword="star" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });
});
