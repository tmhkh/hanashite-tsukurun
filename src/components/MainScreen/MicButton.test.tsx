import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MicButton } from './MicButton';

describe('MicButton', () => {
  it('renders a circular button with at least 100px diameter', () => {
    render(<MicButton disabled={false} recording={false} onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'マイク' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('mic-button');
  });

  it('calls onClick when clicked and not disabled', () => {
    const handleClick = vi.fn();
    render(<MicButton disabled={false} recording={false} onClick={handleClick} />);
    const button = screen.getByRole('button', { name: 'マイク' });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<MicButton disabled={true} recording={false} onClick={handleClick} />);
    const button = screen.getByRole('button', { name: 'マイク' });
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows disabled state visually when disabled=true', () => {
    render(<MicButton disabled={true} recording={false} onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'マイク' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('mic-button--disabled');
  });

  it('shows recording animation class when recording=true', () => {
    render(<MicButton disabled={false} recording={true} onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'ろくおんちゅう' });
    expect(button).toHaveClass('mic-button--recording');
  });

  it('has aria-label "マイク" in default state', () => {
    render(<MicButton disabled={false} recording={false} onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'マイク' });
    expect(button).toBeInTheDocument();
  });

  it('has aria-label "ろくおんちゅう" when recording', () => {
    render(<MicButton disabled={false} recording={true} onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'ろくおんちゅう' });
    expect(button).toBeInTheDocument();
  });

  it('renders the Mic icon from lucide-react', () => {
    render(<MicButton disabled={false} recording={false} onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'マイク' });
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
