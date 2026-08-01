import { Lightbulb, Eye, EyeOff } from 'lucide-react';
import type { Step } from '../../types/index';

/**
 * QuestionRationale コンポーネント Props
 */
export interface QuestionRationaleProps {
  step: Step;
  visible: boolean;
  onToggle: () => void;
}

/** ステップごとの質問理由メッセージ */
const QUESTION_RATIONALE_MESSAGES: Record<Step, string> = {
  1: 'テーマを はっきり させると、みんなに つたわりやすくなるよ',
  2: 'くわしく はなすと、きいてる ひとが イメージ しやすくなるよ',
  3: 'さいごに きもちを つたえると、みんなの こころに のこるよ',
};

/**
 * 質問理由コンポーネント
 *
 * AI の質問の意図をヒントカードとして表示する。
 * トグルボタンで表示/非表示を切り替えられる。
 *
 * Requirements: 16
 */
export function QuestionRationale({ step, visible, onToggle }: QuestionRationaleProps) {
  const message = QUESTION_RATIONALE_MESSAGES[step];

  return (
    <div style={styles.container} data-testid="question-rationale">
      {/* トグルボタン */}
      <button
        type="button"
        onClick={onToggle}
        style={styles.toggleButton}
        aria-label={visible ? 'ヒントを かくす' : 'ヒントを みる'}
      >
        {visible ? (
          <Eye size={16} color="rgba(255, 255, 255, 0.8)" aria-hidden="true" />
        ) : (
          <EyeOff size={16} color="rgba(255, 255, 255, 0.5)" aria-hidden="true" />
        )}
      </button>

      {/* ヒントカード本体 */}
      {visible && (
        <div style={styles.card}>
          <Lightbulb size={16} color="#67e8f9" aria-hidden="true" style={{ flexShrink: 0 }} />
          <span style={styles.message}>{message}</span>
        </div>
      )}
    </div>
  );
}

/**
 * インラインスタイル定義
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
    width: '100%',
    maxWidth: '480px',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background 0.2s ease',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'rgba(103, 232, 249, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '12px',
    border: '1px solid rgba(103, 232, 249, 0.25)',
    boxShadow: '0 2px 12px rgba(103, 232, 249, 0.08)',
    width: '100%',
  },
  message: {
    fontSize: '14px',
    lineHeight: 1.5,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
};
