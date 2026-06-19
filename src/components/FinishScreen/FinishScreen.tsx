import { useState, useCallback } from 'react';
import type { PresentationGuideEntry } from '../../types';
import { MarpSlideViewer } from './MarpSlideViewer';
import { PresentationGuide } from './PresentationGuide';

export interface FinishScreenProps {
  marpMarkdown: string;
  presentationGuide: PresentationGuideEntry[];
  onRestart: () => void;
}

/**
 * 完成画面コンポーネント。
 * - Marp スライドをレンダリングし、1ページずつ表示
 * - スライド下に Presentation_Guide（台本＋アドバイス）をページ連動で表示
 * - 「コピー」ボタンで marp_markdown をクリップボードにコピー
 * - 「もう一度つくる」ボタンで Grade_Selector に戻る
 *
 * Requirements: 7.3, 7.4, 7.5, 7.7, 7.8, 7.9
 */
export function FinishScreen({ marpMarkdown, presentationGuide, onRestart }: FinishScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [copied, setCopied] = useState(false);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(marpMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック: execCommand
      const textarea = document.createElement('textarea');
      textarea.value = marpMarkdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [marpMarkdown]);

  // 現在のページに対応するガイド
  const currentGuide = presentationGuide[currentPage] || null;

  return (
    <div style={containerStyle}>
      {/* 完成メッセージ */}
      <h2 style={titleStyle}>🎉 スライドが できたよ！</h2>

      {/* Marp スライドビューアー */}
      <MarpSlideViewer
        markdown={marpMarkdown}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      {/* Presentation Guide セクション（ページ連動） */}
      {currentGuide && (
        <div style={guideContainerStyle}>
          <PresentationGuide guide={currentGuide} />
        </div>
      )}

      {/* コピーボタン */}
      <button
        type="button"
        onClick={handleCopy}
        style={copyButtonStyle}
        aria-label="スライドのMarkdownをコピー"
      >
        {copied ? '✓ コピーしたよ！' : '📋 スライドを コピー'}
      </button>

      {/* もう一度つくるボタン */}
      <button
        className="finish-restart-button"
        type="button"
        onClick={onRestart}
        aria-label="もう一度つくる"
        style={restartButtonStyle}
      >
        もう一度つくる
      </button>
    </div>
  );
}

// --- Styles ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '24px',
  padding: '24px',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
  textAlign: 'center',
};

const guideContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px',
};

const copyButtonStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  borderRadius: '8px',
  border: '2px solid #10b981',
  backgroundColor: '#ffffff',
  color: '#10b981',
  cursor: 'pointer',
  minWidth: '200px',
};

const restartButtonStyle: React.CSSProperties = {
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
};
