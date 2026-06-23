# Implementation Plan: はなして・つくるん

## Overview

音声対話型スライドビルダーWebアプリ「はなして・つくるん」の実装計画。フロントエンド（React 18 + TypeScript + Vite）とバックエンド（AWS Lambda + Python 3.13 + Amazon Bedrock）の2つのレイヤーに分けて段階的に構築する。モック動作モード（`VITE_MOCK_MODE`）を活用し、フロントエンド単独でも開発・検証できるよう設計する。

## Tasks

- [x] 1. プロジェクト基盤の構築と共通型定義
  - [x] 1.1 フロントエンドのプロジェクト構造・設定を作成する
    - Vite + React 18 + TypeScript プロジェクトを初期化する
    - `pnpm` をパッケージマネージャーとして使用し、`lucide-react`・`fast-check` を追加する
    - `vitest`・`@testing-library/react`・`@testing-library/user-event` を開発依存に追加する
    - `src/` 配下のディレクトリ構造（`components/`, `hooks/`, `services/`, `mocks/`, `types/`, `utils/`）を作成する
    - グローバルフォントスタック（`Rounded Mplus 1c`, `BIZ UDPGothic`, `sans-serif`）をCSSに設定する
    - _Requirements: 10.4_
  - [x] 1.2 TypeScript 共通型定義ファイルを作成する
    - `src/types/index.ts` に `Grade`, `Step`, `SlideData`, `SlideApiRequest`, `SlideApiResponse`, `HistoryEntry`, `AppState` を定義する
    - _Requirements: 4.2, 4.4, 8.2_
  - [x] 1.3 学年ラベル・定数ユーティリティを作成する
    - `src/utils/kanjiGrade.ts` に `GRADE_LABELS`（8学年の日本語表示名）と Grade 配列定数を定義する
    - _Requirements: 1.2_
  - [x] 1.4 Lambda プロジェクト基盤を構築する
    - `lambda/` ディレクトリを作成し、`requirements.txt`（`boto3`, `hypothesis`, `pytest`）を追加する
    - `lambda/types.py` に TypedDict で `SlideRequest`, `SlideResponse` を定義する
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 2. バックエンド Lambda の実装
  - [x] 2.1 リクエストバリデーションモジュールを実装する
    - `lambda/validator.py` に `validate_request(body: dict) -> tuple[bool, str]` を実装する
    - `grade` が `grade0`〜`grade7` 範囲外、または `current_step` が 1/2/3 以外、または必須フィールド欠如の場合は `(False, "invalid request")` を返す
    - _Requirements: 4.8, 5.10_
  - [ ]* 2.2 バリデーション拒否のプロパティテストを書く
    - **Property 4: 無効リクエストのバリデーション拒否（Request Validation Rejection）**
    - **Validates: Requirements 4.8, 5.10**
    - `hypothesis` で範囲外 `grade` / `current_step` を生成し、`validate_request` が `False` を返すことを検証する
  - [x] 2.3 学年別漢字制限プロンプト生成モジュールを実装する
    - `lambda/kanji_filter.py` に `get_kanji_instruction(grade: str) -> str` を実装する
    - `grade0`〜`grade7` の各値に対応するプロンプト指示文字列（設計書のマッピング表通り）を返す
    - `slide_text` と `ai_response_voice` の両フィールドに同一の制限を適用する指示を含める
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  - [ ]* 2.4 漢字制限プロンプトのプロパティテストを書く
    - **Property 3: 学年別漢字制限の適用（Kanji Constraint Propagation）**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9**
    - `hypothesis` で任意の `grade`（grade0〜grade7）× 任意の `user_speech` を生成し、プロンプトに漢字制限指示が含まれることを検証する
  - [x] 2.5 Bedrock_Client モジュールを実装する
    - `lambda/bedrock_client.py` に `invoke_claude(prompt: str, messages: list, model_id: str) -> dict` を実装する
    - `boto3` の `bedrock-runtime` クライアントを使用し、`invoke_model` を呼び出す
    - レスポンスJSONをパースして `SlideResponse` 型の辞書として返す
    - JSON パースエラー時は例外を raise する
    - _Requirements: 4.3_
  - [x] 2.6 Script_Generator モジュールを実装する
    - `lambda/script_generator.py` に `build_script_prompt_suffix(current_step: int) -> str` を実装する
    - `current_step == 3` のとき、100〜400文字の台本生成指示をプロンプトサフィックスとして返す
    - `current_step != 3` のとき、`script` を空文字列にする指示を返す
    - _Requirements: 7.1, 4.4_
  - [x] 2.7 Lambda エントリポイントを実装する
    - `lambda/handler.py` に `lambda_handler(event, context)` を実装する
    - `validator.py` で検証 → 失敗時 HTTP 400 を返す
    - `kanji_filter.py` でプロンプト指示を取得する
    - `bedrock_client.py` でClaude を呼び出す
    - `Access-Control-Allow-Origin` を含むCORSヘッダーをすべてのレスポンスに付与する
    - Bedrock エラー時は HTTP 500 を返す
    - OPTIONS プリフライトリクエストに HTTP 200 を返す
    - _Requirements: 4.1, 4.3, 4.5, 4.6, 4.7, 4.8_
  - [ ]* 2.8 Lambda エンドツーエンド統合テストを書く（Bedrockをモック）
    - `pytest` と `unittest.mock` を使用し、Bedrock 呼び出しをモックして `lambda_handler` を呼び出す
    - 有効なリクエスト → HTTP 200 / 無効なリクエスト → HTTP 400 のシナリオを網羅する
    - _Requirements: 4.1, 4.6, 4.8_

- [x] 3. チェックポイント
  - Ensure all Lambda tests pass, ask the user if questions arise.

- [x] 4. フロントエンド サービスとモック
  - [x] 4.1 モックレスポンスデータを作成する
    - `src/mocks/mockResponses.ts` に `MOCK_RESPONSES: Record<Step, SlideApiResponse>` を定義する
    - Step 3 のモックデータには非空の `script` フィールドを含める（設計書のサンプルデータ通り）
    - _Requirements: 9.2_
  - [x] 4.2 Slide_API サービス（モック切替付き）を実装する
    - `src/services/slideApiService.ts` に `callSlideApi(req: SlideApiRequest): Promise<SlideApiResponse>` を実装する
    - `import.meta.env.VITE_MOCK_MODE === 'true'` のとき `MOCK_RESPONSES[req.current_step]` を返す（500ms 遅延を模倣）
    - それ以外のとき `POST /api/create-slide` へ `fetch` を行い、15秒タイムアウトを `AbortController` で実装する
    - HTTP エラー（4xx/5xx）は例外として throw する
    - _Requirements: 4.1, 9.1, 9.3_
  - [ ]* 4.3 台本空文字列（step 1, 2）のプロパティテストを書く
    - **Property 6: step≠3 のとき script は空文字列（Script Empty for Non-Final Steps）**
    - **Validates: Requirements 4.4**
    - `fast-check` で任意の step=1 または step=2 リクエストを生成し、モックレスポンスの `script === ""` を検証する
  - [ ]* 4.4 台本文字数制約（step 3）のプロパティテストを書く
    - **Property 5: step=3 の台本文字数制約（Script Length Constraint）**
    - **Validates: Requirements 7.1**
    - `fast-check` で step=3 を入力としてモック呼び出しを行い、`100 <= script.length <= 400` を検証する

- [x] 5. カスタムフックの実装
  - [x] 5.1 `useSlideApi` フックを実装する
    - `src/hooks/useSlideApi.ts` を作成し、`call`, `loading`, `error` を返す
    - `loading` が `true` のあいだは Mic_Button を無効化できるよう `loading` を公開する
    - _Requirements: 3.6, 3.7_
  - [x] 5.2 `useSpeechSynthesis` フックを実装する
    - `src/hooks/useSpeechSynthesis.ts` を作成し、`speak`, `isSpeaking`, `cancel` を返す
    - `SpeechSynthesisUtterance` を使用して日本語音声（`lang: 'ja-JP'`）を再生する
    - `onend` イベントで `isSpeaking` を `false` に戻す
    - _Requirements: 2.2, 2.5, 2.6_
  - [x] 5.3 `useSpeechRecognizer` フックを実装する
    - `src/hooks/useSpeechRecognizer.ts` を作成し、`state`, `start`, `stop` を返す
    - `continuous = false` モードで `SpeechRecognition` を使用する
    - 10秒タイムアウトを `setTimeout` で実装し、`onTimeout` コールバックを呼び出す
    - 認識失敗時は `retryCount` をインクリメントし、2回まで `onError` を呼び出す（3回目はエラーメッセージを変える）
    - _Requirements: 3.2, 3.4, 3.5_
  - [ ]* 5.4 AI発話中状態一貫性のプロパティテストを書く
    - **Property 9: AI_Character 発話中の状態一貫性（Speaking State Consistency）**
    - **Validates: Requirements 2.5, 2.6, 10.3**
    - `fast-check` で任意の `ai_response_voice` テキストを生成し、`isSpeaking=true` のあいだ `disabled=true` かつテキスト表示中であること、`isSpeaking=false` になると `disabled=false` に戻ることを検証する

- [x] 6. 会話履歴管理の実装
  - [x] 6.1 会話履歴管理ロジックを `App.tsx` に実装する
    - `history` ステートを `useState<HistoryEntry[]>([])` として管理する
    - Slide_API レスポンス受信後、`user_speech` を `role: "user"`、`ai_response_voice` を `role: "assistant"` として追記する関数を実装する
    - エントリ数が 20 件を超えたとき最古エントリから削除する処理を追加する
    - Grade_Selector 画面表示時に `history` を `[]` に初期化する
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ]* 6.2 会話履歴の最大件数上限プロパティテストを書く
    - **Property 1: 会話履歴の最大件数上限（History Capped）**
    - **Validates: Requirements 8.4**
    - `fast-check` で 21 回以上の発話イベント列を生成し、`history.length <= 20` を常に検証する
  - [ ]* 6.3 会話履歴ラウンドトリップのプロパティテストを書く
    - **Property 2: 会話履歴のラウンドトリップ整合性（History Round-Trip）**
    - **Validates: Requirements 8.2, 8.3**
    - `fast-check` で任意の `user_speech` / `ai_response_voice` ペアを生成し、`history` 末尾の2エントリが正しい `role` / `content` であることを検証する
  - [ ]* 6.4 履歴完全リセットのプロパティテストを書く
    - **Property 8: Grade_Selector 表示時の履歴完全リセット（History Full Reset）**
    - **Validates: Requirements 8.5**
    - `fast-check` で任意の `history` 状態（0〜20件）を生成し、Grade_Selector 遷移後に `history === []` になることを検証する

- [x] 7. チェックポイント
  - Ensure all frontend hook tests pass, ask the user if questions arise.

- [x] 8. UIコンポーネントの実装
  - [x] 8.1 `GradeSelector` コンポーネントを実装する
    - `src/components/GradeSelector/GradeSelector.tsx` を作成する
    - 8種類の学年ボタンを `min-width: 150px, min-height: 150px` 以上のサイズで表示する
    - 各ボタンに `GRADE_LABELS` から学年名称テキストラベルを表示する（16px以上のフォントサイズ）
    - ボタンクリック時に `onSelect(grade)` を呼び出す
    - _Requirements: 1.1, 1.2, 1.5, 10.1, 10.2_
  - [ ]* 8.2 `GradeSelector` ユニットテストを書く
    - 8種類の学年ボタンが表示されること、ボタンクリック時に正しい `grade` が `onSelect` に渡されることを検証する
    - _Requirements: 1.2_
  - [x] 8.3 `SlideIcon` コンポーネントを実装する
    - `src/components/SlidePreview/SlideIcon.tsx` を作成する
    - `image_keyword` を PascalCase に変換し `lucide-react` から動的ルックアップする
    - 対応するアイコンが存在しない場合は `Star` アイコンにフォールバックする
    - _Requirements: 6.4, 6.5_
  - [ ]* 8.4 `SlideIcon` アイコンフォールバックのプロパティテストを書く
    - **Property 7: SlideIcon のエラーレスフォールバック（Icon Error-Free Fallback）**
    - **Validates: Requirements 6.4, 6.5**
    - `fast-check` で任意の文字列（有効・無効・空文字列）を `image_keyword` として `SlideIcon` に渡し、例外なくアイコンが描画されること、未知のキーワードは `Star` アイコンになることを検証する
  - [x] 8.5 `SlideCard` コンポーネントを実装する
    - `src/components/SlidePreview/SlideCard.tsx` を作成する
    - `data=null` のとき `slide_title`・`slide_text` を空欄、アイコン領域にプレースホルダーを表示する
    - `loading=true` のときローディングインジケーターを表示する
    - `data` が有るときは `slide_title`・`slide_text`・`SlideIcon` を表示する
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 8.6 `SlidePreview` コンポーネントを実装する
    - `src/components/SlidePreview/SlidePreview.tsx` を作成する
    - 3枚分のスライド枠を常時表示し、各枠に `SlideCard` を配置する
    - _Requirements: 6.1, 6.2_
  - [x] 8.7 `ProgressBar` コンポーネントを実装する
    - `src/components/MainScreen/ProgressBar.tsx` を作成する
    - Step 1〜3 を「未着手・現在・完了」の3状態を色またはアイコンで識別可能に表示する
    - _Requirements: 6.6_
  - [ ]* 8.8 `ProgressBar` ユニットテストを書く
    - 各ステップ状態（未着手・現在・完了）が互いに識別可能であることを検証する
    - _Requirements: 6.6_
  - [x] 8.9 `MicButton` コンポーネントを実装する
    - `src/components/MainScreen/MicButton.tsx` を作成する
    - 直径100px以上の円形ボタンとしてビューポート中央50%の範囲内に表示する
    - `recording=true` のとき色変化・10px以上拡大アニメーション・点滅のいずれかを表示する
    - `disabled=true` のとき視覚的に無効状態を示す
    - _Requirements: 3.1, 3.3_
  - [ ]* 8.10 `MicButton` ユニットテストを書く
    - `disabled` / `recording` / 通常状態の3パターンの外観差異を検証する
    - _Requirements: 3.1, 3.3_
  - [x] 8.11 `AICharacter` コンポーネントを実装する
    - `src/components/MainScreen/AICharacter.tsx` を作成する
    - `ai_response_voice` のテキストを画面上に吹き出し形式で表示する（16px以上のフォントサイズ）
    - AI発話中に `isSpeaking=true` を反映した視覚状態を示す
    - _Requirements: 2.3, 10.3_

- [x] 9. メイン画面と完成画面の実装
  - [x] 9.1 `FinishScreen` コンポーネントを実装する
    - `src/components/FinishScreen/FinishScreen.tsx` を作成する
    - 3枚のスライドを左から Step 1・2・3 の順に横並びで表示する
    - `script` の内容をスライド下部に表示する
    - 「もう一度つくる」ボタンを表示し、クリック時に `onRestart()` を呼び出す
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 9.2 `MainScreen` コンポーネントを実装する
    - `src/components/MainScreen/MainScreen.tsx` を作成する
    - `useSlideApi`, `useSpeechRecognizer`, `useSpeechSynthesis` フックを組み合わせる
    - 音声認識完了 → `callSlideApi` → スライド更新 → AI発話（`ai_response_voice`）の一連のフローを実装する
    - API リクエスト中は Mic_Button を無効化し、ローディングアニメーションを `SlideCard` に渡す
    - `ai_response_voice` が空文字列のとき「もう一度 やってみてね」を音声再生し Mic_Button を再有効化する
    - タイムアウト・API エラー時のエラー処理フローを実装する（設計書のエラー処理表通り）
    - 学年変更ボタンを配置し、クリック時に `onChangeGrade()` を呼び出す
    - メイン画面起動時に「いっしょに はっぴょうを つくろう！なにについて おはなしする？」を音声再生する
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 3.2, 3.4, 3.5, 3.6, 3.7, 6.2, 6.3, 8.1_

- [x] 10. ルートコンポーネントと画面遷移の実装
  - [x] 10.1 `App.tsx` でルートコンポーネントと画面遷移を実装する
    - `AppState` に基づいて `GradeSelector`・`MainScreen`・`FinishScreen` を切り替える
    - `grade` 選択 → `main` 遷移、Step 3 完了 → `finish` 遷移、「もう一度つくる」→ `grade_select` 遷移を実装する
    - `grade_select` 遷移時に `history` を `[]` に初期化する（要件 8.5）
    - メイン画面から学年を選び直す操作で `grade_select` に戻る処理を実装する
    - アプリ起動時は常に `grade_select` からスタートする（セッション間 Grade 引き継ぎなし）
    - _Requirements: 1.1, 1.3, 1.4, 1.6, 1.7, 7.4, 8.5_

- [x] 11. チェックポイント
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. モック動作モードの最終確認と結合
  - [x] 12.1 `VITE_MOCK_MODE` による動作切替を確認・完成させる
    - `.env.development` に `VITE_MOCK_MODE=true` を設定する
    - `slideApiService.ts` のモック切替が Step 1〜3 で正しく動作することを確認する
    - `VITE_MOCK_MODE` 未設定または `"true"` 以外の場合は本番モードで動作することを確認する
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 12.2 全コンポーネントの統合・結線を完成させる
    - `App.tsx` に全コンポーネント・フック・サービスを正しく組み込む
    - フォントスタックがグローバルCSSに適用されていることを確認する
    - すべての `aria-label` 等アクセシビリティ属性を必要なコンポーネントに付与する
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 13. 最終チェックポイント
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Marp スライドレンダリングと完成画面の改修
  - [ ] 14.1 `@marp-team/marp-core` パッケージを追加する
    - `pnpm add @marp-team/marp-core` を実行し、依存に追加する
    - _Requirements: 7.3_
  - [ ] 14.2 `PresentationGuideEntry` 型を `src/types/index.ts` に追加する
    - `interface PresentationGuideEntry { page: 1 | 2 | 3; script: string; advice: string; }` を定義する
    - `SlideApiResponse` の `script: string` を削除し、`marp_markdown: string` と `presentation_guide: PresentationGuideEntry[]` を追加する
    - `AppState` の `script: string` を `marpMarkdown: string` と `presentationGuide: PresentationGuideEntry[]` に変更する
    - _Requirements: 4.4, 7.1_
  - [ ] 14.3 `MarpSlideViewer` コンポーネントを実装する
    - `src/components/FinishScreen/MarpSlideViewer.tsx` を作成する
    - `@marp-team/marp-core` を使用して Marp Markdown を HTML に変換する
    - 1ページずつ表示し、左右に「前へ」「次へ」ナビゲーションボタンを配置する
    - `currentPage` 変更時に `onPageChange` コールバックを呼び出す
    - _Requirements: 7.3, 7.4_
  - [ ] 14.4 `PresentationGuide` コンポーネントを実装する
    - `src/components/FinishScreen/PresentationGuide.tsx` を作成する
    - `script` を「このページで はなすこと」ラベルの下に表示する
    - `advice` を「プレゼンの コツ」ラベルの下に視覚的に区別して表示する
    - _Requirements: 7.8, 7.9_
  - [ ] 14.5 `FinishScreen` コンポーネントを改修する
    - `FinishScreenProps` を `marpMarkdown: string` + `presentationGuide: PresentationGuideEntry[]` + `onRestart` に変更する
    - `MarpSlideViewer` でスライドをレンダリングし、その下に `PresentationGuide` をページ連動で表示する
    - 「コピー」ボタンを追加し、タップ時に `marp_markdown` 全文をクリップボードにコピーする
    - 「もう一度つくる」ボタンは維持する
    - _Requirements: 7.3, 7.4, 7.5, 7.7, 7.8_
  - [ ] 14.6 モックレスポンスデータを更新する
    - `src/mocks/mockResponses.ts` の `MOCK_RESPONSES` を `marp_markdown` + `presentation_guide` 対応に更新する
    - Step 1, 2 は `marp_markdown: ""`, `presentation_guide: []`
    - Step 3 は Marp 3ページ Markdown + 3要素の `presentation_guide` 配列を含める
    - _Requirements: 9.2_

- [ ] 15. バックエンド: ステップ質問改善と Slide_Exporter 実装
  - [ ] 15.1 `lambda/slide_exporter.py` を実装する（`script_generator.py` を置換）
    - `build_slide_export_prompt_suffix(current_step: int) -> str` を実装する
    - `current_step == 3` のとき、Marp Markdown 生成指示 + presentation_guide 生成指示を返す
    - `current_step != 3` のとき、`marp_markdown` を空文字列 + `presentation_guide` を空配列にする指示を返す
    - _Requirements: 7.1, 7.2, 7.6, 7.10, 7.11_
  - [ ] 15.2 `lambda/kanji_filter.py` の漢字制限バグを修正する
    - プロンプト指示文の適用対象フィールドを全フィールド（`slide_text`, `ai_response_voice`, `marp_markdown`, `presentation_guide` 内 `script` / `advice`）に拡大する
    - _Requirements: 5.9, 7.6, 7.10_
  - [ ] 15.3 `lambda/handler.py` のシステムプロンプトを更新する
    - ステップ別質問指示（つかみ→展開→結論の動的質問生成）を追加する
    - `script_generator` の import を `slide_exporter` に変更する
    - JSON 出力フォーマットを `marp_markdown` + `presentation_guide` に更新する
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 4.4, 7.1_
  - [ ] 15.4 `lambda/handler.py` の漢字制限プロンプト統合テストを更新する
    - 全フィールドへの漢字制限適用が含まれることをアサートする
    - _Requirements: 5.9_

- [ ] 16. フロントエンド: MainScreen と App の結合更新
  - [ ] 16.1 `MainScreen` を新レスポンス形式に対応させる
    - `onComplete` コールバックの引数を `(slides, marpMarkdown, presentationGuide)` に変更する
    - Step 3 レスポンス受信時に `marp_markdown` と `presentation_guide` を親に渡す
    - _Requirements: 7.3_
  - [ ] 16.2 `App.tsx` の状態管理を更新する
    - `AppState` を新定義（`marpMarkdown`, `presentationGuide`）に合わせる
    - `FinishScreen` に `marpMarkdown` と `presentationGuide` を props として渡す
    - _Requirements: 7.3, 7.8_
  - [ ] 16.3 `slideApiService.ts` のモック切替を更新する
    - 新 `SlideApiResponse` 型（`marp_markdown` + `presentation_guide`）に対応する
    - _Requirements: 9.1, 9.2_

- [ ] 17. プロパティテスト更新
  - [ ]* 17.1 Property 5（Marp出力）のプロパティテストを書く
    - **Property 5: step=3 の Marp Markdown 生成（Marp Output on Final Step）**
    - **Validates: Requirements 7.1, 7.2**
    - `fast-check` で step=3 モック呼び出しを行い、`marp_markdown` が非空 + フロントマター含む + 3ページ、`presentation_guide` が3要素であることを検証する
  - [ ]* 17.2 Property 6（空出力）のプロパティテストを書く
    - **Property 6: step≠3 のとき空出力（Empty Output for Non-Final Steps）**
    - **Validates: Requirements 4.4**
    - `fast-check` で step=1 or 2 モック呼び出しを行い、`marp_markdown === ""` かつ `presentation_guide === []` を検証する
  - [ ]* 17.3 Property 3（漢字制限全フィールド適用）のプロパティテストを更新する
    - **Property 3: 学年別漢字制限の適用（Kanji Constraint Propagation）**
    - **Validates: Requirements 5.1〜5.9**
    - `hypothesis` で任意の grade を生成し、プロンプト指示に `marp_markdown` と `presentation_guide` が漢字制限対象として含まれることを検証する

- [ ] 18. 最終チェックポイント（新仕様）
  - Ensure all tests pass with new Marp/presentation_guide implementation, ask the user if questions arise.

## Notes

- タスクに `*` が付いているものはオプションで、MVP実装では省略可能
- 各タスクは依存する前タスクの完了を前提として進める
- フロントエンドのプロパティテストには `fast-check`、Lambda のプロパティテストには `hypothesis` を使用する
- チェックポイントはフロントエンド・バックエンドそれぞれの節目に設けている
- デプロイ・インフラ設定（AWS CDK/SAM、S3/CloudFront 等）は本タスクリストの対象外

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "2.6", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.7", "5.1", "5.2", "5.3", "6.1"] },
    { "id": 3, "tasks": ["2.8", "4.2", "5.4", "6.2", "6.3", "6.4"] },
    { "id": 4, "tasks": ["4.3", "4.4", "8.1", "8.3", "8.5", "8.7", "8.9", "8.11"] },
    { "id": 5, "tasks": ["8.2", "8.4", "8.6", "8.8", "8.10", "9.1"] },
    { "id": 6, "tasks": ["9.2"] },
    { "id": 7, "tasks": ["10.1"] },
    { "id": 8, "tasks": ["12.1", "12.2"] },
    { "id": 9, "tasks": ["14.1", "14.2", "15.1", "15.2"] },
    { "id": 10, "tasks": ["14.3", "14.4", "14.6", "15.3", "15.4"] },
    { "id": 11, "tasks": ["14.5", "16.1", "16.2", "16.3"] },
    { "id": 12, "tasks": ["17.1", "17.2", "17.3"] }
  ]
}
```
