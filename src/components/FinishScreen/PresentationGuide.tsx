import type { PresentationGuideEntry } from '../../types';

export interface PresentationGuideProps {
  guide: PresentationGuideEntry;
}

/**
 * Presentation Guide コンポーネント。
 * 現在のスライドページに対応する台本とプレゼンアドバイスを表示する。
 *
 * - 「このページで はなすこと」ラベル下に script を表示
 * - 「プレゼンの コツ」ラベル下に advice を視覚的に区別して表示
 *
 * Requirements: 7.8, 7.9
 */
export function PresentationGuide({ guide }: PresentationGuideProps) {
  return (
    <div style={containerStyle} aria-label={`ページ ${guide.page} のガイド`}>
      {/* 台本セクション */}
      <div style={sectionStyle}>
        <h4 style={labelStyle}>
          🎤 このページで はなすこと
        </h4>
        <p style={scriptTextStyle}>
          {guide.script}
        </p>
      </div>

      {/* アドバイスセクション */}
      <div style={adviceSectionStyle}>
        <h4 style={adviceLabelStyle}>
          💡 プレゼンの コツ
        </h4>
        <p style={adviceTextStyle}>
          {guide.advice}
        </p>
      </div>
    </div>
  );
}

// --- Styles ---

const containerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '16px 20px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  color: '#1f2937',
};

const scriptTextStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.8',
  margin: 0,
  whiteSpace: 'pre-wrap',
  color: '#374151',
};

const adviceSectionStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '16px 20px',
};

const adviceLabelStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  color: '#92400e',
};

const adviceTextStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.8',
  margin: 0,
  whiteSpace: 'pre-wrap',
  color: '#78350f',
};
