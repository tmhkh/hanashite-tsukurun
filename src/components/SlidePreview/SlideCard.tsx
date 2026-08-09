import type { Step, SlideData } from '../../types';
import { SlideIcon } from './SlideIcon';

export interface SlideCardProps {
  step: Step;
  data: SlideData | null;
  loading: boolean;
}

/**
 * 1枚分のスライドカード（グラスモルフィズム）。
 * - data=null: プレースホルダー（空欄＋アイコン領域にグレー丸）
 * - loading=true: ローディングインジケーター（パルスアニメーション）
 * - data有り: slide_title・slide_text・SlideIcon を表示
 */
export function SlideCard({ step, data, loading }: SlideCardProps) {
  return (
    <div
      className="slide-card"
      data-step={step}
      aria-label={`スライド ${step}`}
      style={cardStyle}
    >
      {loading && (
        <div
          className="slide-card-loading"
          aria-label="読み込み中"
          style={loadingOverlayStyle}
        >
          <div
            className="slide-card-spinner"
            style={spinnerStyle}
          />
        </div>
      )}

      {/* アイコン領域 */}
      <div
        className="slide-card-icon"
        style={iconAreaStyle}
      >
        {data ? (
          <SlideIcon keyword={data.image_keyword} size={48} />
        ) : (
          <div
            className="slide-card-placeholder-icon"
            aria-label="アイコンプレースホルダー"
            style={placeholderIconStyle}
          />
        )}
      </div>

      {/* タイトル */}
      <h3
        className="slide-card-title"
        style={titleStyle}
      >
        {data?.slide_title ?? ''}
      </h3>

      {/* テキスト */}
      <p
        className="slide-card-text"
        style={textStyle}
      >
        {data?.slide_text ?? ''}
      </p>
    </div>
  );
}

// --- Styles ---

const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  borderRadius: '20px',
  padding: '20px',
  minWidth: '180px',
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
  position: 'relative',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.12)',
  transition: 'all 0.3s ease',
};

const loadingOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  borderRadius: '20px',
  zIndex: 1,
};

const spinnerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '4px solid rgba(255, 255, 255, 0.3)',
  borderTopColor: '#ffffff',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const iconAreaStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
};

const placeholderIconStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  margin: 0,
  textAlign: 'center',
  minHeight: '1.4em',
  color: '#ffffff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
};

const textStyle: React.CSSProperties = {
  fontSize: '16px',
  margin: 0,
  textAlign: 'center',
  minHeight: '1.4em',
  color: 'rgba(255, 255, 255, 0.9)',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
};
