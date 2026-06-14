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
 * すごろく風進捗バーコンポーネント
 *
 * Step 1〜3 を横並びで表示し、各ステップの状態を
 * 完了（緑系）・現在（青系）・未着手（グレー系）の3状態で
 * 色とアイコンにより識別可能に表示する。
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
                  ? '#4caf50'
                  : '#e0e0e0',
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
              color: getStepState(step) === 'upcoming' ? '#9e9e9e' : '#333',
              fontWeight: getStepState(step) === 'current' ? 'bold' : 'normal',
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
        backgroundColor: '#4caf50',
        borderColor: '#388e3c',
        color: '#fff',
      };
    case 'current':
      return {
        backgroundColor: '#2196f3',
        borderColor: '#1565c0',
        color: '#fff',
      };
    case 'upcoming':
      return {
        backgroundColor: '#e0e0e0',
        borderColor: '#bdbdbd',
        color: '#757575',
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
    padding: '16px 8px',
    gap: '0',
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
    height: '4px',
    zIndex: 0,
  },
  node: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  },
  stepNumber: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  label: {
    marginTop: '8px',
    fontSize: '14px',
    textAlign: 'center',
  },
};
