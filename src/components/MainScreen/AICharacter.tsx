import { type CSSProperties } from 'react';

export interface AICharacterProps {
  text: string;
  isSpeaking: boolean;
}

const bubbleStyle: CSSProperties = {
  position: 'relative',
  background: 'rgba(255, 255, 255, 0.25)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '20px',
  padding: '20px 24px',
  fontSize: '18px',
  lineHeight: 1.6,
  maxWidth: '480px',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
  color: '#ffffff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
};

const speakingBubbleStyle: CSSProperties = {
  ...bubbleStyle,
  animation: 'pulse 1.5s ease-in-out infinite',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.25), 0 0 20px rgba(99, 102, 241, 0.2)',
};

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
};

export function AICharacter({ text, isSpeaking }: AICharacterProps) {
  if (!text) {
    return null;
  }

  return (
    <div style={containerStyle} data-testid="ai-character">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }
      `}</style>
      <div
        style={isSpeaking ? speakingBubbleStyle : bubbleStyle}
        aria-live="polite"
        aria-label="AIキャラクターの吹き出し"
        data-testid="ai-bubble"
        data-speaking={isSpeaking}
      >
        {text}
      </div>
    </div>
  );
}
