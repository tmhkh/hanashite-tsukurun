import { useMemo, useCallback } from 'react';
import { SlideIcon } from '../SlidePreview/SlideIcon';

export interface MarpSlideViewerProps {
  markdown: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

interface SlideContent {
  title: string;
  body: string;
  icon: string;
}

/**
 * Marp Markdown をパースし、1ページずつスライド表示する（グラスモルフィズム）。
 * 左右ナビゲーションボタンでページ送り。
 *
 * Requirements: 7.3, 7.4
 */
export function MarpSlideViewer({ markdown, currentPage, onPageChange }: MarpSlideViewerProps) {
  const slides = useMemo<SlideContent[]>(() => {
    if (!markdown || markdown.trim() === '') {
      return [];
    }

    const content = markdown.replace(/^---\n[\s\S]*?\n---/, '').trim();
    const pages = content.split(/\n---\n/).filter((p) => p.trim() !== '');

    return pages.map((page) => {
      const lines = page.trim().split('\n');
      let title = '';
      let body = '';
      let icon = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          title = trimmed.slice(2).trim();
        } else if (trimmed.startsWith('<!-- icon:')) {
          const match = trimmed.match(/<!-- icon:\s*(\S+)\s*-->/);
          if (match) icon = match[1];
        } else if (trimmed !== '') {
          body += (body ? '\n' : '') + trimmed;
        }
      }

      return { title, body, icon };
    });
  }, [markdown]);

  const totalPages = slides.length || 1;
  const currentSlide = slides[currentPage];

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
        {currentSlide ? (
          <div style={slideContentStyle}>
            {/* アイコン */}
            {currentSlide.icon && (
              <div style={iconAreaStyle}>
                <SlideIcon keyword={currentSlide.icon} size={56} />
              </div>
            )}
            {/* タイトル */}
            <h1 style={slideTitleStyle}>{currentSlide.title}</h1>
            {/* 区切り線 */}
            <div style={dividerStyle} />
            {/* 本文 */}
            <p style={slideBodyStyle}>{currentSlide.body}</p>
            {/* ページ番号 */}
            <span style={pageNumStyle}>{currentPage + 1} / {totalPages}</span>
          </div>
        ) : (
          <div style={emptyStyle}>
            スライドデータがありません
          </div>
        )}
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
  gap: '16px',
};

const slideAreaStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  borderRadius: '24px',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
  minHeight: '360px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const slideContentStyle: React.CSSProperties = {
  width: '100%',
  padding: '40px 48px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
};

const iconAreaStyle: React.CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
};

const slideTitleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  margin: 0,
  color: '#ffffff',
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const dividerStyle: React.CSSProperties = {
  width: '60px',
  height: '3px',
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  borderRadius: '2px',
};

const slideBodyStyle: React.CSSProperties = {
  fontSize: '20px',
  lineHeight: '1.8',
  margin: 0,
  color: 'rgba(255, 255, 255, 0.92)',
  whiteSpace: 'pre-wrap',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
};

const pageNumStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.5)',
  marginTop: '12px',
};

const emptyStyle: React.CSSProperties = {
  padding: '40px',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '16px',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const navButtonStyle: React.CSSProperties = {
  padding: '12px 28px',
  fontSize: '16px',
  fontWeight: 700,
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  background: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#ffffff',
  cursor: 'pointer',
  minWidth: '100px',
  boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)',
  transition: 'all 0.3s ease',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
};
