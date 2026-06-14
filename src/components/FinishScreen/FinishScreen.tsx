import type { SlideData } from '../../types';
import { SlideIcon } from '../SlidePreview/SlideIcon';

export interface FinishScreenProps {
  slides: SlideData[];
  script: string;
  onRestart: () => void;
}

/**
 * 完成画面コンポーネント。
 * - 3枚のスライドを左から Step 1・2・3 の順に横並びで表示する
 * - script の内容をスライド下部に表示する（台本エリア）
 * - 「もう一度つくる」ボタンを表示し、クリック時に onRestart() を呼び出す
 */
export function FinishScreen({ slides, script, onRestart }: FinishScreenProps) {
  return (
    <div
      className="finish-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '24px',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* スライド横並びエリア */}
      <div
        className="finish-slides"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          width: '100%',
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.step}
            className="finish-slide-card"
            aria-label={`スライド ${slide.step}`}
            style={{
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '180px',
              minHeight: '200px',
              flex: '1 1 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fff',
            }}
          >
            {/* ステップ番号 */}
            <span
              className="finish-slide-step"
              style={{
                fontSize: '14px',
                color: '#6366f1',
                fontWeight: 'bold',
              }}
            >
              Step {index + 1}
            </span>

            {/* アイコン */}
            <div
              className="finish-slide-icon"
              style={{
                width: '64px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SlideIcon keyword={slide.image_keyword} size={48} />
            </div>

            {/* タイトル */}
            <h3
              className="finish-slide-title"
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {slide.slide_title}
            </h3>

            {/* テキスト */}
            <p
              className="finish-slide-text"
              style={{
                fontSize: '16px',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {slide.slide_text}
            </p>
          </div>
        ))}
      </div>

      {/* 台本エリア */}
      <div
        className="finish-script"
        aria-label="発表台本"
        style={{
          width: '100%',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '0 0 12px 0',
          }}
        >
          📝 はっぴょう だいほん
        </h3>
        <p
          className="finish-script-text"
          style={{
            fontSize: '16px',
            lineHeight: '1.8',
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {script}
        </p>
      </div>

      {/* もう一度つくるボタン */}
      <button
        className="finish-restart-button"
        onClick={onRestart}
        aria-label="もう一度つくる"
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          padding: '16px 32px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: '#6366f1',
          color: '#fff',
          cursor: 'pointer',
          minWidth: '200px',
          minHeight: '56px',
        }}
      >
        もう一度つくる
      </button>
    </div>
  );
}
