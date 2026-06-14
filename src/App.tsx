import { useState, useCallback } from 'react';
import type { Grade, SlideData, HistoryEntry } from './types/index';
import GradeSelector from './components/GradeSelector/GradeSelector';
import { MainScreen } from './components/MainScreen/MainScreen';
import { FinishScreen } from './components/FinishScreen/FinishScreen';

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
 * AppState に基づいて GradeSelector・MainScreen・FinishScreen を切り替える。
 * - アプリ起動時は常に grade_select からスタート（要件 1.1, 1.7）
 * - grade 選択 → main 遷移（要件 1.3, 1.4）
 * - Step 3 完了（onComplete コールバック）→ finish 遷移（要件 7.4）
 * - 「もう一度つくる」→ grade_select 遷移（要件 7.4）
 * - メイン画面から学年を選び直す操作（onChangeGrade）で grade_select に戻る（要件 1.6）
 * - grade_select 遷移時に history を [] に初期化する（要件 8.5）
 *
 * Requirements: 1.1, 1.3, 1.4, 1.6, 1.7, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export default function App() {
  /** 現在の画面 */
  const [screen, setScreen] = useState<Screen>('grade_select');

  /** 選択された学年 */
  const [grade, setGrade] = useState<Grade | null>(null);

  /**
   * 会話履歴配列（最大 20 件）
   * Requirements: 8.1, 8.4
   */
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  /** 完成したスライドデータ（FinishScreen に渡す） */
  const [finishedSlides, setFinishedSlides] = useState<SlideData[]>([]);

  /** 完成した台本（FinishScreen に渡す） */
  const [finishedScript, setFinishedScript] = useState<string>('');

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
  const handleComplete = useCallback((slides: SlideData[], script: string) => {
    setFinishedSlides(slides);
    setFinishedScript(script);
    setScreen('finish');
  }, []);

  // --- 画面ルーティング ---

  return (
    <div>
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
          slides={finishedSlides}
          script={finishedScript}
          onRestart={showGradeSelector}
        />
      )}
    </div>
  );
}
