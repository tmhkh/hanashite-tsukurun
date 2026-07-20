import type { PresentationGuideEntry } from '../../types';

export interface PresentationGuideProps {
  guide: PresentationGuideEntry;
}

/**
 * Presentation Guide コンポーネント（グラスモルフィズム）。
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
          このページで はなすこと
        </h4>
        <p style={scriptTextStyle}>
          {guide.script}
        </p>
      </div>

      {/* アドバイスセクション */}
      <div style={adviceSectionStyle}>
        <h4 style={adviceLabelStyle}>
          プレゼンの コツ
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
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '16px',
  padding: '20px 24px',
  boxShadow: '0 4px 16px rgba(31, 38, 135, 0.08)',
};

const labelStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  margin: '0 0 8px 0',
  color: '#ffffff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
};

const scriptTextStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.8',
  margin: 0,
  whiteSpace: 'pre-wrap',
  color: 'rgba(255, 255, 255, 0.9)',
};

const adviceSectionStyle: React.CSSProperties = {
  background: 'rgba(245, 158, 11, 0.15)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  borderRadius: '16px',
  padding: '20px 24px',
  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)',
};

const adviceLabelStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  margin: '0 0 8px 0',
  color: '#ffffff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
};

const adviceTextStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.8',
  margin: 0,
  whiteSpace: 'pre-wrap',
  color: 'rgba(255, 255, 255, 0.9)',
};
