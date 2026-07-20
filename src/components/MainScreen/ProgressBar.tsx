import { Check } from 'lucide-react';
import type { Step } from '../../types/index';

/**
 * ProgressBar コンポーネント Props
 */
interface ProgressBarProps {
  currentStep: Step;
  completedSteps: Step[];
}

/**
 * ステップの状態
 */
type StepState = 'completed' | 'current' | 'upcoming';

/**
 * ステップごとのラベル
 */
const STEP_LABELS: Record<Step, string> = {
  1: 'タイトル',
  2: 'なかみ',
  3: 'まとめ',
};

/**
 * すごろく風進捗バーコンポーネント（グラスモルフィズム）
 *
 * Step 1〜3 を横並びで表示し、各ステップの状態を
 * 完了・現在・未着手の3状態でガラス風ノードにより識別する。
 *
 * Requirements: 6.6
 */
export default function ProgressBar({ currentStep, completedSteps }: ProgressBarProps) {
  const steps: Step[] = [1, 2, 3];

  const getStepState = (step: Step): StepState => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div style={styles.container} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3}>
      {steps.map((step, index) => (
        <div key={step} style={styles.stepWrapper}>
          {/* コネクタライン（最初のステップ以外） */}
          {index > 0 && (
            <div
              style={{
                ...styles.connector,
                backgroundColor: completedSteps.includes(step) || step === currentStep
                  ? 'rgba(255, 255, 255, 0.6)'
                  : 'rgba(255, 255, 255, 0.2)',
              }}
            />
          )}
          {/* ステップノード */}
          <div
            style={{
              ...styles.node,
              ...getNodeStyle(getStepState(step)),
            }}
            aria-label={`ステップ${step} ${STEP_LABELS[step]} ${getStepStateLabel(getStepState(step))}`}
          >
            {getStepState(step) === 'completed' ? (
              <Check size={20} color="#fff" aria-hidden="true" />
            ) : (
              <span style={styles.stepNumber}>{step}</span>
            )}
          </div>
          {/* ステップラベル */}
          <span
            style={{
              ...styles.label,
              color: getStepState(step) === 'upcoming' ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
              fontWeight: getStepState(step) === 'current' ? 700 : 400,
            }}
          >
            {STEP_LABELS[step]}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * ステップ状態に応じたノードスタイルを返す
 */
function getNodeStyle(state: StepState): React.CSSProperties {
  switch (state) {
    case 'completed':
      return {
        background: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 0.8)',
        color: '#fff',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
      };
    case 'current':
      return {
        background: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        color: '#fff',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
      };
    case 'upcoming':
      return {
        background: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        color: 'rgba(255, 255, 255, 0.6)',
        boxShadow: 'none',
      };
  }
}

/**
 * ステップ状態のアクセシビリティラベル
 */
function getStepStateLabel(state: StepState): string {
  switch (state) {
    case 'completed':
      return '完了';
    case 'current':
      return '現在';
    case 'upcoming':
      return '未着手';
  }
}

/**
 * インラインスタイル定義
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    gap: '0',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: '400px',
  },
  stepWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  connector: {
    position: 'absolute',
    top: '20px',
    right: '50%',
    width: '100%',
    height: '3px',
    zIndex: 0,
    borderRadius: '2px',
  },
  node: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  stepNumber: {
    fontSize: '16px',
    fontWeight: 700,
  },
  label: {
    marginTop: '8px',
    fontSize: '14px',
    textAlign: 'center',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
};
