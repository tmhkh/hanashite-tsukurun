// 学年区分
export type Grade =
  | 'grade0'
  | 'grade1'
  | 'grade2'
  | 'grade3'
  | 'grade4'
  | 'grade5'
  | 'grade6'
  | 'grade7';

// スライド作成ステップ
export type Step = 1 | 2 | 3;

// 1枚分のスライドデータ
export interface SlideData {
  step: Step;
  slide_title: string;
  slide_text: string;
  image_keyword: string;
}

// Slide_API リクエスト
export interface SlideApiRequest {
  grade: Grade;
  current_step: Step;
  user_speech: string;    // 1文字以上
  history: HistoryEntry[];
}

// Slide_API レスポンス
export interface SlideApiResponse {
  slide_title: string;
  slide_text: string;
  image_keyword: string;  // 英単語
  ai_response_voice: string;
  next_step: 2 | 3 | 4;  // 4 = 完成
  script: string;         // step 3 のみ非空
}

// 会話履歴エントリ
export interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

// アプリグローバル状態
export interface AppState {
  screen: 'grade_select' | 'main' | 'finish';
  grade: Grade | null;
  currentStep: Step;
  completedSteps: Step[];
  slides: (SlideData | null)[];  // インデックス 0=step1, 1=step2, 2=step3
  history: HistoryEntry[];       // 最大20件
  script: string;
}
