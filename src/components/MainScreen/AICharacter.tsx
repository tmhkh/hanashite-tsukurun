import { type CSSProperties } from 'react';

export interface AICharacterProps {
  text: string;
  isSpeaking: boolean;
}

const bubbleStyle: CSSProperties = {
  position: 'relative',
  backgroundColor: '#e8f4fd',
  borderRadius: '16px',
  padding: '16px 20px',
  fontSize: '18px',
  lineHeight: 1.6,
  maxWidth: '480px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const speakingBubbleStyle: CSSProperties = {
  ...bubbleStyle,
  animation: 'pulse 1.5s ease-in-out infinite',
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
