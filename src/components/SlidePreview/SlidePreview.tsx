import type { Step, SlideData } from '../../types';
import { SlideCard } from './SlideCard';

export interface SlidePreviewProps {
  slides: (SlideData | null)[];
  currentStep: Step;
  loading: boolean;
}

/**
 * 3枚分のスライド枠を常時表示するプレビューコンポーネント。
 * - slides[0] = Step 1, slides[1] = Step 2, slides[2] = Step 3
 * - loading は currentStep に対応するスライドカードにのみ適用する
 */
export function SlidePreview({ slides, currentStep, loading }: SlidePreviewProps) {
  const steps: Step[] = [1, 2, 3];

  return (
    <div
      className="slide-preview"
      aria-label="スライドプレビュー"
      style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '16px',
      }}
    >
      {steps.map((step) => (
        <SlideCard
          key={step}
          step={step}
          data={slides[step - 1] ?? null}
          loading={loading && currentStep === step}
        />
      ))}
    </div>
  );
}
