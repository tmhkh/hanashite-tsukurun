import { Star } from 'lucide-react';

export interface CompletionFeedbackProps {
  feedback: string;
}

/**
 * 完了フィードバックカード。
 * Star アイコンとフィードバックテキストを暖色パステルグラデーション背景で表示。
 * グラスモルフィズムスタイル（暖色系）。
 */
export function CompletionFeedback({ feedback }: CompletionFeedbackProps) {
  if (!feedback) {
    return null;
  }

  return (
    <div style={cardStyle}>
      <div style={iconContainerStyle}>
        <Star size={28} color="#f59e0b" fill="#fbbf24" />
      </div>
      <p style={textStyle}>{feedback}</p>
    </div>
  );
}

// --- Styles ---

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  padding: '24px 28px',
  borderRadius: '20px',
  background: 'rgba(251, 191, 36, 0.15)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(251, 191, 36, 0.3)',
  boxShadow: '0 4px 24px rgba(245, 158, 11, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  textAlign: 'center',
};

const iconContainerStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: 'rgba(251, 191, 36, 0.2)',
  border: '1px solid rgba(251, 191, 36, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const textStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.7',
  margin: 0,
  color: '#ffffff',
  whiteSpace: 'pre-wrap',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
};
