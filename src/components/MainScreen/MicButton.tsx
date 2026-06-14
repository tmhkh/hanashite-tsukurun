import { Mic } from 'lucide-react';
import './MicButton.css';

export interface MicButtonProps {
  disabled: boolean;
  recording: boolean;
  onClick: () => void;
}

export function MicButton({ disabled, recording, onClick }: MicButtonProps) {
  return (
    <button
      type="button"
      className={`mic-button${recording ? ' mic-button--recording' : ''}${disabled ? ' mic-button--disabled' : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={recording ? 'ろくおんちゅう' : 'マイク'}
    >
      <Mic size={48} />
    </button>
  );
}
