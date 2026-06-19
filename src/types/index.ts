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

// Presentation Guide エントリ
export interface PresentationGuideEntry {
  page: 1 | 2 | 3;
  script: string;         // そのページで話す台本
  advice: string;         // プレゼンの構造・伝え方アドバイス
}

// Slide_API レスポンス
export interface SlideApiResponse {
  slide_title: string;
  slide_text: string;
  image_keyword: string;  // 英単語
  ai_response_voice: string;
  next_step: 2 | 3 | 4;  // 4 = 完成
  marp_markdown: string;  // step 3 のみ Marp 形式 Markdown（3ページ）、それ以外は空文字
  presentation_guide: PresentationGuideEntry[];  // step 3 のみ3要素、それ以外は空配列
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
  marpMarkdown: string;          // step 3 完了時に設定
  presentationGuide: PresentationGuideEntry[];  // step 3 完了時に設定
}
