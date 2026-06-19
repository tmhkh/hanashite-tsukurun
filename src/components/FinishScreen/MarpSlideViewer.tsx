import { useMemo, useState, useCallback } from 'react';
import Marp from '@marp-team/marp-core';

export interface MarpSlideViewerProps {
  markdown: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

/**
 * Marp Markdown をスライドとしてレンダリングし、1ページずつ表示する。
 * 左右ナビゲーションボタンでページ送り。
 *
 * Requirements: 7.3, 7.4
 */
export function MarpSlideViewer({ markdown, currentPage, onPageChange }: MarpSlideViewerProps) {
  const [totalPages, setTotalPages] = useState(1);

  // Marp Markdown → HTML 変換
  const slideHtml = useMemo(() => {
    try {
      const marp = new Marp({
        html: false,
        math: false,
      });
      const { html, css } = marp.render(markdown);

      // ページ数をカウント（section タグの数）
      const sectionCount = (html.match(/<section[\s>]/g) || []).length;
      setTotalPages(Math.max(sectionCount, 1));

      // CSS + HTML を結合
      return `<style>${css}</style>${html}`;
    } catch {
      return '<p>スライドの表示に失敗しました</p>';
    }
  }, [markdown]);

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  return (
    <div style={containerStyle}>
      {/* スライド表示エリア */}
      <div style={slideAreaStyle}>
        <div
          style={{
            ...slideFrameStyle,
            // 現在のページのみ表示するため CSS で制御
          }}
          dangerouslySetInnerHTML={{
            __html: `
              <style>
                .marp-slide-container section { display: none !important; }
                .marp-slide-container section:nth-of-type(${currentPage + 1}) { display: block !important; }
                .marp-slide-container section {
                  width: 100% !important;
                  height: auto !important;
                  min-height: 300px;
                  padding: 24px !important;
                  box-sizing: border-box;
                }
              </style>
              <div class="marp-slide-container">${slideHtml}</div>
            `,
          }}
        />
      </div>

      {/* ナビゲーション */}
      <div style={navStyle}>
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 0}
          style={{
            ...navButtonStyle,
            opacity: currentPage <= 0 ? 0.3 : 1,
          }}
          aria-label="前のスライド"
        >
          ← まえ
        </button>

        <span style={pageIndicatorStyle}>
          {currentPage + 1} / {totalPages}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages - 1}
          style={{
            ...navButtonStyle,
            opacity: currentPage >= totalPages - 1 ? 0.3 : 1,
          }}
          aria-label="次のスライド"
        >
          つぎ →
        </button>
      </div>
    </div>
  );
}

// --- Styles ---

const containerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
};

const slideAreaStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  border: '2px solid #e0e0e0',
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
};

const slideFrameStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '300px',
  padding: '0',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const navButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 'bold',
  borderRadius: '8px',
  border: '2px solid #6366f1',
  backgroundColor: '#ffffff',
  color: '#6366f1',
  cursor: 'pointer',
  minWidth: '100px',
};

const pageIndicatorStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#4b5563',
};
