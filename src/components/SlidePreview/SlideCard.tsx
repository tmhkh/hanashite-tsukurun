import type { Step, SlideData } from '../../types';
import { SlideIcon } from './SlideIcon';

export interface SlideCardProps {
  step: Step;
  data: SlideData | null;
  loading: boolean;
}

/**
 * 1枚分のスライドカード。
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
      style={{
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '180px',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#fff',
        position: 'relative',
      }}
    >
      {loading && (
        <div
          className="slide-card-loading"
          aria-label="読み込み中"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: '12px',
            zIndex: 1,
          }}
        >
          <div
            className="slide-card-spinner"
            style={{
              width: '32px',
              height: '32px',
              border: '4px solid #e0e0e0',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}

      {/* アイコン領域 */}
      <div
        className="slide-card-icon"
        style={{
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {data ? (
          <SlideIcon keyword={data.image_keyword} size={48} />
        ) : (
          <div
            className="slide-card-placeholder-icon"
            aria-label="アイコンプレースホルダー"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
            }}
          />
        )}
      </div>

      {/* タイトル */}
      <h3
        className="slide-card-title"
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          margin: 0,
          textAlign: 'center',
          minHeight: '1.4em',
        }}
      >
        {data?.slide_title ?? ''}
      </h3>

      {/* テキスト */}
      <p
        className="slide-card-text"
        style={{
          fontSize: '16px',
          margin: 0,
          textAlign: 'center',
          minHeight: '1.4em',
        }}
      >
        {data?.slide_text ?? ''}
      </p>
    </div>
  );
}
