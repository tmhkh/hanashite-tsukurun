import { useState, useCallback } from 'react';
import type { Grade, SlideData, HistoryEntry, PresentationGuideEntry } from './types/index';
import GradeSelector from './components/GradeSelector/GradeSelector';
import { MainScreen } from './components/MainScreen/MainScreen';
import { FinishScreen } from './components/FinishScreen/FinishScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen/LoginScreen';

/**
 * アプリ画面区分
 */
type Screen = 'grade_select' | 'main' | 'finish';

/**
 * 履歴の最大保持件数
 * テストから参照できるようエクスポート
 */
export const MAX_HISTORY_SIZE = 20;

/**
 * App ルートコンポーネント
 *
 * AuthProvider でラップし、認証状態に基づいてコンテンツを切り替える。
 * - 未認証時は LoginScreen を表示し、Grade_Selector 以降へのアクセスを遮断（要件 2.1）
 * - 認証済み時はログアウトボタンを表示（要件 7.3）
 * - ログアウト時にトークン破棄と LoginScreen 遷移（要件 7.4）
 * - VITE_MOCK_MODE=true の場合は認証スキップ（要件 8.1）
 *
 * Requirements: 2.1, 7.3, 7.4, 8.1
 */
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

/**
 * AppContent — 認証ガード付きアプリコンテンツ
 *
 * useAuth() で認証状態を確認し、コンテンツの表示を制御する。
 * - isLoading: ローディング表示
 * - 未認証: LoginScreen 表示（Grade_Selector 以降へのアクセス遮断）
 * - 認証済み: 既存の画面ルーティング + ログアウトボタン
 *
 * Requirements: 2.1, 7.3, 7.4
 */
function AppContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  /** 現在の画面 */
  const [screen, setScreen] = useState<Screen>('grade_select');

  /** 選択された学年 */
  const [grade, setGrade] = useState<Grade | null>(null);

  /**
   * 会話履歴配列（最大 20 件）
   * Requirements: 8.1, 8.4
   */
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  /** 完成したスライドデータ（将来拡張用に保持） */
  const [, setFinishedSlides] = useState<SlideData[]>([]);

  /** 完成した Marp Markdown（FinishScreen に渡す） */
  const [finishedMarpMarkdown, setFinishedMarpMarkdown] = useState<string>('');

  /** 完成した Presentation Guide（FinishScreen に渡す） */
  const [finishedPresentationGuide, setFinishedPresentationGuide] = useState<PresentationGuideEntry[]>([]);

  /**
   * Slide_API レスポンス受信後に履歴へ追記する。
   *
   * - user_speech を role: "user" として追加
   * - ai_response_voice を role: "assistant" として追加
   * - エントリ数が 20 件を超えた場合、最古から削除して 20 件以内に収める
   *
   * Requirements: 8.2, 8.3, 8.4
   */
  const appendToHistory = useCallback(
    (userSpeech: string, aiVoice: string) => {
      setHistory((prev) => {
        const next: HistoryEntry[] = [
          ...prev,
          { role: 'user', content: userSpeech },
          { role: 'assistant', content: aiVoice },
        ];
        // 20 件を超えた分は先頭（最古）から削除する
        return next.length > MAX_HISTORY_SIZE
          ? next.slice(next.length - MAX_HISTORY_SIZE)
          : next;
      });
    },
    []
  );

  /**
   * Grade_Selector 画面に遷移し、履歴を完全リセットする。
   * Requirements: 8.5
   */
  const showGradeSelector = useCallback(() => {
    setHistory([]);
    setScreen('grade_select');
  }, []);

  /**
   * 学年選択完了時のハンドラー
   * Requirements: 1.3, 1.4
   */
  const handleGradeSelect = useCallback((selectedGrade: Grade) => {
    setGrade(selectedGrade);
    setScreen('main');
  }, []);

  /**
   * Step 3 完了時のハンドラー → 完成画面へ遷移
   * Requirements: 7.4
   */
  const handleComplete = useCallback((slides: SlideData[], marpMarkdown: string, presentationGuide: PresentationGuideEntry[]) => {
    setFinishedSlides(slides);
    setFinishedMarpMarkdown(marpMarkdown);
    setFinishedPresentationGuide(presentationGuide);
    setScreen('finish');
  }, []);

  // --- ローディング中 ---
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  // --- 未認証: LoginScreen を表示し、Grade_Selector 以降へのアクセスを遮断 ---
  // Requirements: 2.1
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // --- 認証済み: 既存の画面ルーティング + ログアウトボタン ---
  return (
    <div>
      {/* ログアウトボタン — 認証済み時に常に表示（Requirement 7.3, 7.4） */}
      <button
        onClick={logout}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          padding: '8px 20px',
          fontSize: '14px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#ffffff',
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)',
          transition: 'all 0.3s ease',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
        aria-label="ログアウト"
      >
        ログアウト
      </button>

      {screen === 'grade_select' && (
        <GradeSelector onSelect={handleGradeSelect} />
      )}

      {screen === 'main' && grade !== null && (
        <MainScreen
          grade={grade}
          history={history}
          onComplete={handleComplete}
          onChangeGrade={showGradeSelector}
          onHistoryUpdate={appendToHistory}
        />
      )}

      {screen === 'finish' && (
        <FinishScreen
          marpMarkdown={finishedMarpMarkdown}
          presentationGuide={finishedPresentationGuide}
          onRestart={showGradeSelector}
        />
      )}
    </div>
  );
}
