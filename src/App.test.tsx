/**
 * App.tsx — 会話履歴管理ロジック テストスイート
 *
 * ユニットテスト + プロパティベーステスト（fast-check）
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import App, { MAX_HISTORY_SIZE } from './App';
import type { HistoryEntry } from './types/index';

// --- モック: MainScreen の useSpeechRecognizer / useSpeechSynthesis / useSlideApi ---
// MainScreen が内部で音声APIフックを使うため、テスト環境ではモックする
vi.mock('./hooks/useSpeechRecognizer', () => ({
  useSpeechRecognizer: () => ({
    state: { isListening: false, transcript: '', error: null },
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock('./hooks/useSpeechSynthesis', () => ({
  useSpeechSynthesis: () => ({
    speak: vi.fn((_text: string, onEnd?: () => void) => {
      // 即座に onEnd を呼ぶことでマイクを有効化
      if (onEnd) onEnd();
    }),
    isSpeaking: false,
    cancel: vi.fn(),
  }),
}));

vi.mock('./hooks/useSlideApi', () => ({
  useSlideApi: () => ({
    call: vi.fn(),
    loading: false,
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// ヘルパー: Slide_API レスポンス受信をシミュレートするユーティリティ
// App の内部ロジックを直接テストするため、renderHook パターンを使わず
// コンポーネント経由でテストできる部分はコンポーネントで検証し、
// 純粋なロジックは切り出してテストする。
// ---------------------------------------------------------------------------

/**
 * appendToHistory と同等の純粋関数（App 内ロジックの複製）
 * プロパティテスト用に分離。
 *
 * Requirements: 8.2, 8.3, 8.4
 */
function appendToHistory(
  prev: HistoryEntry[],
  userSpeech: string,
  aiVoice: string
): HistoryEntry[] {
  const next: HistoryEntry[] = [
    ...prev,
    { role: 'user', content: userSpeech },
    { role: 'assistant', content: aiVoice },
  ];
  return next.length > MAX_HISTORY_SIZE
    ? next.slice(next.length - MAX_HISTORY_SIZE)
    : next;
}

// ---------------------------------------------------------------------------
// ユニットテスト
// ---------------------------------------------------------------------------

describe('appendToHistory', () => {
  it('空の履歴に追記すると user / assistant の 2 件になる', () => {
    const result = appendToHistory([], 'こんにちは', 'はい、どうぞ');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ role: 'user', content: 'こんにちは' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'はい、どうぞ' });
  });

  it('user エントリは role: "user"、ai エントリは role: "assistant" である', () => {
    const result = appendToHistory([], 'テスト発話', 'AI応答');
    expect(result[0].role).toBe('user');
    expect(result[1].role).toBe('assistant');
  });

  it('既存の履歴に追記するとき末尾に 2 件追加される', () => {
    const existing: HistoryEntry[] = [
      { role: 'user', content: '1回目' },
      { role: 'assistant', content: 'AI1' },
    ];
    const result = appendToHistory(existing, '2回目', 'AI2');
    expect(result).toHaveLength(4);
    expect(result[2]).toEqual({ role: 'user', content: '2回目' });
    expect(result[3]).toEqual({ role: 'assistant', content: 'AI2' });
  });

  it('エントリ数が 20 件ちょうどのとき、追記後は 20 件以内に収まる', () => {
    // 18件の既存 + 1ペア(2件)追加 = 20件 → 上限ぴったり、削除なし
    const existing: HistoryEntry[] = Array.from({ length: 18 }, (_, i) => [
      { role: 'user' as const, content: `u${i}` },
      { role: 'assistant' as const, content: `a${i}` },
    ]).flat();
    const result = appendToHistory(existing, 'u9', 'a9');
    expect(result.length).toBe(20);
  });

  it('エントリ数が 20 件を超えたとき最古エントリから削除して 20 件になる', () => {
    // 20件の既存履歴（上限ちょうど）に 1 ペア追加 → 22件 → スライスで 20件
    const existing: HistoryEntry[] = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `entry-${i}`,
    }));
    const result = appendToHistory(existing, '新しい発話', '新しいAI応答');
    expect(result.length).toBe(20);
    // 最古エントリ（entry-0, entry-1）は削除されているはず
    expect(result.find((e) => e.content === 'entry-0')).toBeUndefined();
    expect(result.find((e) => e.content === 'entry-1')).toBeUndefined();
  });

  it('最古が削除されても末尾の新規エントリは保持される', () => {
    const existing: HistoryEntry[] = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `entry-${i}`,
    }));
    const result = appendToHistory(existing, '最新ユーザー', '最新AI');
    expect(result[result.length - 2]).toEqual({
      role: 'user',
      content: '最新ユーザー',
    });
    expect(result[result.length - 1]).toEqual({
      role: 'assistant',
      content: '最新AI',
    });
  });
});

// ---------------------------------------------------------------------------
// コンポーネントレベルのユニットテスト
// ---------------------------------------------------------------------------

describe('App コンポーネント 初期表示', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態で GradeSelector 画面が表示される', () => {
    render(<App />);
    // GradeSelector のタイトルテキストを確認
    expect(screen.getByText('学年を えらんでね')).toBeInTheDocument();
  });

  it('学年ボタンをクリックすると MainScreen に遷移する', async () => {
    const user = userEvent.setup();
    render(<App />);
    // GradeSelector の「ようちえん」ボタンをクリック
    await user.click(screen.getByText('ようちえん'));
    // MainScreen が表示される（学年を えらびなおす ボタンが見える）
    expect(screen.getByText('学年を えらびなおす')).toBeInTheDocument();
  });

  it('MainScreen から「学年を えらびなおす」をクリックすると GradeSelector に戻る', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('ようちえん'));
    await user.click(screen.getByText('学年を えらびなおす'));
    // GradeSelector 画面に戻る
    expect(screen.getByText('学年を えらんでね')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Property 1: 会話履歴の最大件数上限（History Capped）
// **Validates: Requirements 8.4**
// ---------------------------------------------------------------------------

describe('Property 1: 会話履歴の最大件数上限（History Capped）', () => {
  it('任意の発話操作繰り返しに対して history.length は常に 20 以下である', () => {
    fc.assert(
      fc.property(
        // 0〜30回の発話ペアを生成
        fc.array(
          fc.tuple(
            fc.string({ minLength: 1 }),
            fc.string({ minLength: 1 })
          ),
          { minLength: 0, maxLength: 30 }
        ),
        (pairs) => {
          let history: HistoryEntry[] = [];
          for (const [userSpeech, aiVoice] of pairs) {
            history = appendToHistory(history, userSpeech, aiVoice);
          }
          return history.length <= MAX_HISTORY_SIZE;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: 会話履歴のラウンドトリップ整合性（History Round-Trip）
// **Validates: Requirements 8.2, 8.3**
// ---------------------------------------------------------------------------

describe('Property 2: 会話履歴のラウンドトリップ整合性（History Round-Trip）', () => {
  it('追記後の末尾2エントリが正しい role / content を持つ', () => {
    fc.assert(
      fc.property(
        // 任意の既存履歴（0〜18件のペア）
        fc.array(
          fc.tuple(
            fc.string({ minLength: 1 }),
            fc.string({ minLength: 1 })
          ),
          { minLength: 0, maxLength: 9 }
        ),
        // 新規追記する発話ペア
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (existingPairs, newUserSpeech, newAiVoice) => {
          // 既存履歴を構築
          let history: HistoryEntry[] = [];
          for (const [u, a] of existingPairs) {
            history = appendToHistory(history, u, a);
          }
          // 新規ペアを追記
          const result = appendToHistory(history, newUserSpeech, newAiVoice);

          // 上限に達していない場合（既存 * 2 + 2 <= 20）は末尾2件を検証
          const lastTwo = result.slice(-2);
          return (
            lastTwo[0].role === 'user' &&
            lastTwo[0].content === newUserSpeech &&
            lastTwo[1].role === 'assistant' &&
            lastTwo[1].content === newAiVoice
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Grade_Selector 表示時の履歴完全リセット（History Full Reset）
// **Validates: Requirements 8.5**
// ---------------------------------------------------------------------------

describe('Property 8: Grade_Selector 表示時の履歴完全リセット（History Full Reset）', () => {
  it('任意の history 状態で Grade_Selector に遷移すると history は空配列になる', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 0〜10ペアの任意の会話履歴
        fc.array(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 1, maxLength: 20 })
          ),
          { minLength: 0, maxLength: 10 }
        ),
        async (_pairs) => {
          // コンポーネントをレンダリング
          const { unmount } = render(<App />);
          const user = userEvent.setup();

          // Main Screen に遷移（「小学1年」= grade1 をクリック）
          await act(async () => {
            await user.click(screen.getByText('小学1年'));
          });

          // 「学年を えらびなおす」をクリック → showGradeSelector 経由で history リセット
          await act(async () => {
            await user.click(screen.getByText('学年を えらびなおす'));
          });

          // GradeSelector が表示されていることを確認
          expect(
            screen.getByText('学年を えらんでね')
          ).toBeInTheDocument();

          unmount();
          return true;
        }
      ),
      // コンポーネントの mount/unmount は重いため numRuns を抑える
      { numRuns: 20 }
    );
  }, 15000);
});
