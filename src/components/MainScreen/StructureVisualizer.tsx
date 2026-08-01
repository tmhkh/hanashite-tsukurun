import { Sparkles, MessageCircle, Flag } from 'lucide-react';
import type { Step } from '../../types/index';

/**
 * StructureVisualizer のステップ情報
 */
interface StructureVisualizerStep {
  step: Step;
  label: string;
  description: string;
  icon: string;
  state: 'completed' | 'current' | 'upcoming';
}

/**
 * StructureVisualizer コンポーネント Props
 */
export interface StructureVisualizerProps {
  currentStep: Step;
  completedSteps: Step[];
}

/** ステップ定義 */
const STEP_DEFINITIONS: { step: Step; label: string; description: string; icon: string }[] = [
  { step: 1, label: 'つかみ', description: 'みんなの きょうみを ひく', icon: 'Sparkles' },
  { step: 2, label: 'なかみ', description: 'いちばん つたえたい ことを はなす', icon: 'MessageCircle' },
  { step: 3, label: 'まとめ', description: 'さいごに まとめて つたえる', icon: 'Flag' },
];

/**
 * 構造ビジュアライザーコンポーネント（グラスモルフィズム）
 *
 * Step 1〜3 を横並びで表示し、各ステップの状態を
 * 完了・現在・未着手の3状態でアイコン＋ラベル＋説明文により識別する。
 * ProgressBar の後継コンポーネント。
 *
 * Requirements: 14
 */
export function StructureVisualizer({ currentStep, completedSteps }: StructureVisualizerProps) {
  const getStepState = (step: Step): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(step)) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const steps: StructureVisualizerStep[] = STEP_DEFINITIONS.map((def) => ({
    ...def,
    state: getStepState(def.step),
  }));

  return (
    <div style={styles.container} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3}>
      {steps.map((stepInfo, index) => (
        <div key={stepInfo.step} style={styles.stepWrapper}>
          {/* コネクタライン（最初のステップ以外） */}
          {index > 0 && (
            <div
              style={{
                ...styles.connector,
                backgroundColor: stepInfo.state === 'completed' || stepInfo.state === 'current'
                  ? 'rgba(255, 255, 255, 0.6)'
                  : 'rgba(255, 255, 255, 0.2)',
              }}
            />
          )}
          {/* ステップアイコンノード */}
          <div
            style={{
              ...styles.iconNode,
              ...getNodeStyle(stepInfo.state),
            }}
            aria-label={`ステップ${stepInfo.step} ${stepInfo.label} ${getStepStateLabel(stepInfo.state)}`}
          >
            {renderIcon(stepInfo.step, stepInfo.state)}
          </div>
          {/* ラベル */}
          <span
            style={{
              ...styles.label,
              color: stepInfo.state === 'upcoming' ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
              fontWeight: stepInfo.state === 'current' ? 700 : 500,
            }}
          >
            {stepInfo.label}
          </span>
          {/* 説明文 */}
          <span
            style={{
              ...styles.description,
              color: stepInfo.state === 'upcoming' ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.8)',
            }}
          >
            {stepInfo.description}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * ステップに応じたアイコンをレンダリング
 */
function renderIcon(step: Step, state: 'completed' | 'current' | 'upcoming') {
  const size = 22;
  const color = state === 'upcoming' ? 'rgba(255, 255, 255, 0.5)' : '#fff';
  switch (step) {
    case 1:
      return <Sparkles size={size} color={color} aria-hidden="true" />;
    case 2:
      return <MessageCircle size={size} color={color} aria-hidden="true" />;
    case 3:
      return <Flag size={size} color={color} aria-hidden="true" />;
  }
}

/**
 * ステップ状態に応じたノードスタイルを返す
 */
function getNodeStyle(state: 'completed' | 'current' | 'upcoming'): React.CSSProperties {
  switch (state) {
    case 'completed':
      return {
        background: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 0.8)',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
      };
    case 'current':
      return {
        background: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
        transform: 'scale(1.08)',
      };
    case 'upcoming':
      return {
        background: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.25)',
        boxShadow: 'none',
      };
  }
}

/**
 * ステップ状態のアクセシビリティラベル
 */
function getStepStateLabel(state: 'completed' | 'current' | 'upcoming'): string {
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
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '20px 16px',
    gap: '0',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: '480px',
  },
  stepWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
    gap: '6px',
  },
  connector: {
    position: 'absolute',
    top: '22px',
    right: '50%',
    width: '100%',
    height: '3px',
    zIndex: 0,
    borderRadius: '2px',
  },
  iconNode: {
    width: '44px',
    height: '44px',
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
  label: {
    fontSize: '14px',
    textAlign: 'center',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  description: {
    fontSize: '11px',
    textAlign: 'center',
    lineHeight: 1.4,
    maxWidth: '120px',
  },
};
