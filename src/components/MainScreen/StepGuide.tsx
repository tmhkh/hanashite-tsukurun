import { useState, useEffect, useCallback } from 'react';
import { Lightbulb } from 'lucide-react';
import type { Step } from '../../types/index';

/**
 * StepGuide コンポーネント Props
 */
export interface StepGuideProps {
  step: Step;
  visible: boolean;
  onDismiss: () => void;
}

/** ステップごとのガイドメッセージ */
const STEP_GUIDE_MESSAGES: Record<Step, string> = {
  1: "いまのが『つかみ』だよ！みんなが『なんだろう？』っておもう はじめかただね",
  2: "これが『なかみ』！くわしく はなすと みんなに つたわるよ",
  3: '',
};

/**
 * ステップガイドコンポーネント
 *
 * ステップ完了時に表示される教育的カード。
 * AIキャラクターの吹き出しとは異なる配色（アンバー/イエロー系）で表示し、
 * 5秒後に自動フェードアウトする。
 *
 * Requirements: 15
 */
export function StepGuide({ step, visible, onDismiss }: StepGuideProps) {
  const [opacity, setOpacity] = useState(1);
  const message = STEP_GUIDE_MESSAGES[step];

  // メッセージが空（step 3）の場合は何も表示しない
  if (!message) {
    return null;
  }

  // 自動フェードタイマー
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!visible) {
      setOpacity(0);
      return;
    }

    setOpacity(1);
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, [visible]);

  // フェードアウト完了後に onDismiss を呼ぶ
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleTransitionEnd = useCallback(() => {
    if (opacity === 0) {
      onDismiss();
    }
  }, [opacity, onDismiss]);

  return (
    <div
      style={{
        ...styles.container,
        opacity,
        pointerEvents: opacity === 0 ? 'none' : 'auto',
      }}
      onTransitionEnd={handleTransitionEnd}
      data-testid="step-guide"
      aria-live="polite"
    >
      <div style={styles.iconWrapper}>
        <Lightbulb size={20} color="#fbbf24" aria-hidden="true" />
      </div>
      <span style={styles.message}>{message}</span>
    </div>
  );
}

/**
 * インラインスタイル定義
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    background: 'rgba(251, 191, 36, 0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: '1px solid rgba(251, 191, 36, 0.35)',
    boxShadow: '0 4px 16px rgba(251, 191, 36, 0.1)',
    maxWidth: '480px',
    width: '100%',
    transition: 'opacity 0.5s ease',
  },
  iconWrapper: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: '15px',
    lineHeight: 1.5,
    color: '#ffffff',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
};
