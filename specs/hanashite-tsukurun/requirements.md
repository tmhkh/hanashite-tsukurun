# Requirements Document

## Introduction

「はなして・つくるん」は、幼稚園〜中学生以上を対象とした、音声対話型スライドビルダーWebアプリケーションである。ユーザーはキーボード操作を一切行わず、AIキャラクター（優しい女性の先生）との音声会話だけで、学校の発表会などに使える「紙芝居風スライド3枚」と「サンプルスライド（Marp形式）」を完成させることができる。

技術スタックは、フロントエンドにReact（Web Speech API）、バックエンドにAWS Lambda + Amazon API Gateway、AIにAmazon Bedrock（Claude 3.5 Sonnet / Haiku）を使用する。

---

## Glossary

- **App**: 本Webアプリケーション全体（「はなして・つくるん」）
- **Child_User**: アプリを利用する幼稚園〜中学生以上のユーザー
- **Grade_Selector**: 学年選択UIコンポーネント
- **Mic_Button**: 音声入力を開始・終了する巨大マイクボタンコンポーネント
- **Speech_Recognizer**: Web Speech API を用いた音声認識モジュール
- **Slide_Preview**: スライド内容をリアルタイムに表示するプレビューエリア
- **Progress_Bar**: 現在のステップ（1〜3）をすごろく風に示す進捗バー
- **AI_Character**: 優しい女性の先生キャラクター（音声・テキストでユーザーに話しかける）
- **Slide_API**: バックエンドのHTTPエンドポイント（`POST /api/create-slide`）
- **Lambda_Handler**: AWS Lambda 上のバックエンド処理関数
- **Bedrock_Client**: Amazon Bedrock（Claude）を呼び出すモジュール
- **Kanji_Filter**: 学年に応じて漢字使用を制限するロジック
- **Slide_Exporter**: 最終ステップで Marp 形式の Markdown スライドを生成するロジック
- **Marp**: Markdown からスライドを生成するオープンソースツール。`@marp-team/marp-core` パッケージを使用してフロントエンドでレンダリングする
- **Presentation_Guide**: 完成時に生成される各スライドページごとの台本（`script`）とプレゼンアドバイス（`advice`）のセット。完成画面でスライド下に表示される
- **Grade**: 学年区分。`grade0`（幼稚園）, `grade1`（小1）, `grade2`（小2）, `grade3`（小3）, `grade4`（小4）, `grade5`（小5）, `grade6`（小6）, `grade7`（中学生以上）の8種類
- **Step**: スライド作成の進行ステップ。`1`（つかみ・導入）, `2`（いちばんつたえたいこと・展開）, `3`（まとめ・結論）の3段階
- **image_keyword**: スライドに表示するSVGアイコンを選択するための英単語キー。Marp Markdown 内ではコメントとして埋め込まれる

---

## Requirements

---

### 要件1：学年選択

**ユーザーストーリー：** ユーザーとして、アプリ起動時に自分の学年を選びたい。そうすることで、自分のレベルに合ったひらがな・漢字のスライドを作れるようにしたい。

#### 受入基準

1. WHEN Child_User がアプリをコールドスタート（新規起動）したとき、THE App SHALL Grade_Selector を最初の画面として表示する。
2. THE Grade_Selector SHALL `grade0`（ようちえん）、`grade1`（小学1年）、`grade2`（小学2年）、`grade3`（小学3年）、`grade4`（小学4年）、`grade5`（小学5年）、`grade6`（小学6年）、`grade7`（中学生以上）の8種類を、各学年名称のテキストラベルを含む大きなビジュアルボタンとして表示する。
3. WHEN Child_User が Grade_Selector でいずれかの学年ボタンをタップまたはクリックしたとき、THE App SHALL 選択された Grade をアプリ終了または別の学年が選択されるまでセッション全体を通じて保持する。
4. WHEN Child_User が学年を選択したとき、THE App SHALL Grade_Selector 画面を閉じ、メイン画面（スライド作成画面）に遷移する。
5. THE Grade_Selector SHALL 各ボタンを、タッチ操作に適した横幅150px以上・縦幅150px以上のサイズで表示する。
6. WHEN Child_User がメイン画面から学年を選び直す操作を行ったとき、THE App SHALL Grade_Selector 画面を再表示し、新しい学年を選択できるようにする。
7. WHEN App が再起動したとき、THE App SHALL 前回のセッションで選択された Grade を引き継がず、Grade_Selector 画面を表示する。

---

### 要件2：AI_Character による音声ナビゲーション

**ユーザーストーリー：** ユーザーとして、AIキャラクターに話しかけてもらいたい。そうすることで、次に何を話せばいいかがわかり、スライド作りを迷わず進められるようにしたい。

#### 受入基準

1. WHEN メイン画面が起動したとき、THE AI_Character SHALL 「いっしょに はっぴょうを つくろう！なにについて おはなしする？」という音声メッセージを再生する。
2. WHEN Slide_API からレスポンスを受信したとき、THE AI_Character SHALL レスポンス内の `ai_response_voice` フィールドのテキストを音声で読み上げる。ただし `ai_response_voice` が空文字列の場合、THE App SHALL エラーメッセージ「もう一度 やってみてね」を音声で再生し、Mic_Button を有効状態に戻す。
3. THE AI_Character SHALL 各ステップで1つの質問のみを Child_User に対して行う。質問はプレゼンの構造（つかみ→展開→結論）に沿い、Child_User のテーマと前のステップの回答内容に基づいて動的に生成する。
4. WHEN Step 1（つかみ・導入）のとき、THE AI_Character SHALL Child_User の発表テーマを引き出し、さらに「それってどんなもの？」「みんなに しってほしい ポイントは？」のようにテーマの輪郭を具体化する質問を行う。
5. WHEN Step 2（いちばんつたえたいこと・展開）のとき、THE AI_Character SHALL Step 1 で得たテーマに基づき、「いちばん すきなところ」「おもしろかったこと」「びっくりしたこと」など、具体的なエピソードや詳細を引き出す質問を行う。
6. WHEN Step 3（まとめ・結論）のとき、THE AI_Character SHALL これまでの会話を踏まえ、「さいごに みんなに つたえたい きもちは？」「これからどうしたい？」のように、感想や呼びかけで締めくくるための質問を行う。
7. THE AI_Character SHALL ユーザーへのすべての発話を、対象 Grade の漢字制限に基づいて許可される漢字のみを使用して表示・読み上げる。`grade7`（中学生以上）の場合は制限なしで通常の日本語を使用する。
8. WHILE AI_Character が発話中のとき、THE Mic_Button SHALL タップ不可（無効）状態を視覚的に示す。
9. WHEN AI_Character の発話が終了したとき、THE Mic_Button SHALL タップ可能（有効）状態に自動的に復帰する。

---

### 要件3：音声入力

**ユーザーストーリー：** 子どもとして、大きなマイクボタンを押して話すだけで入力したい。そうすることで、キーボードを使わずに自分の気持ちをスライドに反映できるようにしたい。

#### 受入基準

1. THE Mic_Button SHALL ビューポートの中央50%の範囲内に、直径100px以上の円形ボタンとして表示する。
2. WHEN Child_User が Mic_Button をタップまたはクリックしたとき、THE Speech_Recognizer SHALL Web Speech API の `continuous = false` モードで音声認識を開始する。
3. WHILE 音声認識が進行中のとき、THE Mic_Button SHALL 色の変化またはサイズが10px以上拡大するアニメーション、もしくは視覚的に識別可能な点滅を表示し、録音中であることを示す。
4. WHEN Speech_Recognizer が発話の終了を検知したとき、THE Speech_Recognizer SHALL 認識されたテキストを自動的に確定し、Slide_API へのリクエスト送信を開始する。ただし、Mic_Button 押下から10秒間音声が検知されない場合、THE App SHALL タイムアウトとして音声認識を停止し、エラーメッセージを再生する。
5. IF Speech_Recognizer が音声を認識できなかった場合、THEN THE App SHALL 「もう一度 話してみてね」という音声メッセージを再生し、Mic_Button を再度有効状態に戻す。再試行は最大2回まで許容し、3回目の失敗時は「うまく きけなかったよ。もう一度 はじめから」という固定メッセージを表示する。
6. WHILE Slide_API へのリクエストが処理中のとき、THE App SHALL ローディングアニメーションを表示し、Mic_Button をタップ不可状態にする。
7. IF Slide_API へのリクエストが15秒以内にレスポンスを返さなかった場合、THEN THE App SHALL ローディングアニメーションを停止し、「もう一度 やってみてね」という音声メッセージを再生し、Mic_Button を有効状態に戻す。

---

### 要件4：スライド生成API（Slide_API）

**ユーザーストーリー：** システムとして、子どもの発話とコンテキストを受け取り、スライドコンテンツと次の質問を生成したい。そうすることで、子どもが一貫性のあるスライドを完成できるようにしたい。

#### 受入基準

1. THE Slide_API SHALL `POST /api/create-slide` エンドポイントとして公開される。
2. THE Slide_API SHALL 以下のフィールドをすべて含むJSONリクエストボディを受け付ける：`grade`（文字列: `"grade0"`, `"grade1"`, `"grade2"`, `"grade3"`, `"grade4"`, `"grade5"`, `"grade6"`, `"grade7"` のいずれか）、`current_step`（整数: 1, 2, 3 のいずれか）、`user_speech`（文字列: 1文字以上）、`history`（配列: `role` と `content` フィールドを持つオブジェクトの配列）。
3. WHEN Slide_API が有効なリクエストを受信したとき、THE Lambda_Handler SHALL Bedrock_Client を通じて Amazon Bedrock（Claude 3.5 Sonnet または Haiku）を呼び出してスライドコンテンツを生成する。
4. THE Slide_API SHALL 以下のすべてのフィールドを含むJSONレスポンスを返す：`slide_title`（文字列）、`slide_text`（文字列）、`image_keyword`（文字列: 英単語）、`ai_response_voice`（文字列）、`next_step`（整数: 2, 3, または 4）、`marp_markdown`（文字列: `current_step` が 3 のときのみ Marp 形式の Markdown スライドを含む非空文字列、それ以外は空文字列）、`presentation_guide`（配列: `current_step` が 3 のときのみ3要素を持つ配列、それ以外は空配列。各要素は `page`（整数: 1, 2, 3）、`script`（文字列: そのページで話す台本）、`advice`（文字列: プレゼンの構造・伝え方に関する小学生向けアドバイス）のフィールドを持つオブジェクト）。
5. THE Slide_API SHALL `Access-Control-Allow-Origin` を含むCORSレスポンスヘッダーを返し、ブラウザからの直接呼び出しを許可する。
6. IF Slide_API がリクエスト処理中にエラーが発生した場合、THEN THE Slide_API SHALL HTTPステータスコード 500 と `{"error": "<エラー内容の説明>"}` 形式のJSONレスポンスを返す。
7. THE Slide_API SHALL リクエスト受信から10秒以内にレスポンスを返す。
8. IF リクエストボディに必須フィールドが欠如している、または `grade` / `current_step` の値が許容範囲外である場合、THEN THE Slide_API SHALL HTTPステータスコード 400 と `{"error": "invalid request"}` 形式のJSONレスポンスを返す。

---

### 要件5：学年別漢字制限（Kanji_Filter）

**ユーザーストーリー：** ユーザーとして、自分の学年で読める漢字だけが使われたスライドを受け取りたい。そうすることで、スライドの文字を自分で読んで発表できるようにしたい。

#### 受入基準

1. WHEN Lambda_Handler が `grade0` のリクエストを処理するとき、THE Kanji_Filter SHALL Bedrock_Client へのプロンプトに、漢字を一切使わずひらがな・カタカナのみで出力するよう指示を含める。
2. WHEN Lambda_Handler が `grade1` のリクエストを処理するとき、THE Kanji_Filter SHALL Bedrock_Client へのプロンプトに、文部科学省指定の小学1年生配当漢字80字のみ使用するよう指示を含める。
3. WHEN Lambda_Handler が `grade2` のリクエストを処理するとき、THE Kanji_Filter SHALL Bedrock_Client へのプロンプトに、文部科学省指定の小学1〜2年生配当漢字計240字のみ使用するよう指示を含める。
4. WHEN Lambda_Handler が `grade3` のリクエストを処理するとき、THE Kanji_Filter SHALL Bedrock_Client へのプロンプトに、文部科学省指定の小学1〜3年生配当漢字計440字のみ使用するよう指示を含める。
5. WHEN Lambda_Handler が `grade4` のリクエストを処理するとき、THE Kanji_Filter SHALL Bedrock_Client へのプロンプトに、文部科学省指定の小学1〜4年生配当漢字計640字のみ使用するよう指示を含める。
6. WHEN Lambda_Handler が `grade5` のリクエストを処理するとき、THE Kanji_Filter SHALL Bedrock_Client へのプロンプトに、文部科学省指定の小学1〜5年生配当漢字計825字のみ使用するよう指示を含める。
7. WHEN Lambda_Handler が `grade6` のリクエストを処理するとき、THE Kanji_Filter SHALL Bedrock_Client へのプロンプトに、文部科学省指定の小学1〜6年生配当漢字計1026字のみ使用するよう指示を含める。
8. WHEN Lambda_Handler が `grade7` のリクエストを処理するとき、THE Kanji_Filter SHALL Bedrock_Client へのプロンプトに、常用漢字（2136字）の範囲内で制限なく漢字を使用してよいと指示を含める。
9. WHEN Lambda_Handler がいずれかの `grade` のリクエストを処理するとき、THE Kanji_Filter SHALL `ai_response_voice` フィールドに対して、対象 Grade の漢字制限と同じ制限を適用するよう指示を含める。ただし `grade7` の場合は制限なし。
10. IF `grade` フィールドが `grade0`〜`grade7` の範囲外の値であった場合、THEN THE Lambda_Handler SHALL HTTPステータスコード 400 を返し、Bedrock_Client の呼び出しを行わない。

---

### 要件6：スライドプレビューのリアルタイム更新

**ユーザーストーリー：** 子どもとして、自分が話した内容がすぐにスライドに反映されるのを見たい。そうすることで、達成感を感じながらスライド作りを楽しめるようにしたい。

#### 受入基準

1. THE App SHALL メイン画面に3枚分のスライド枠を常時表示する。未完成のスライドは `slide_title` および `slide_text` が空欄、アイコン領域にプレースホルダーを表示した状態とする。
2. WHEN Slide_API からレスポンスを受信したとき、THE Slide_Preview SHALL 受信完了から1秒以内に対応するステップのスライドを `slide_title`、`slide_text`、および `image_keyword` に対応するSVGアイコンで更新する。
3. WHILE Slide_API へのリクエストが送信中〜レスポンス受信前のとき、THE Slide_Preview SHALL 対象スライド枠にローディングインジケーターを表示する。
4. THE Slide_Preview SHALL `image_keyword` の値に対応する Lucide Icons のアイコンを表示する。
5. IF `image_keyword` に対応する Lucide Icons のアイコンが存在しない場合、THEN THE Slide_Preview SHALL デフォルトとして Lucide Icons の `Star` アイコンを表示する。
6. THE Progress_Bar SHALL Step 1〜3 の各状態（完了済み・現在・未着手）を、色またはアイコンの外観において互いに識別可能な形で表示し、現在の Step に応じてリアルタイムに更新する。

---

### 要件7：3ステップ完了とサンプルスライド生成（Marp）

**ユーザーストーリー：** 子どもとして、3回話し終わったらサンプルスライドを見たい。そうすることで、完成したスライドの見た目を確認し、自信を持って発表できるようにしたい。

#### 受入基準

1. WHEN `current_step` が 3 のリクエストに対して Slide_API がレスポンスを返したとき、THE Slide_Exporter SHALL `marp_markdown` フィールドに Marp 形式の Markdown テキストを含める。Marp Markdown は先頭に YAML フロントマター（`---\nmarp: true\ntheme: default\npaginate: true\n---`）を含み、各スライドを `---` で区切った3ページ構成とする。
2. THE Slide_Exporter SHALL `marp_markdown` の各ページに、対応するステップの `slide_title` を見出し（`#`）として、`slide_text` を本文として含め、`image_keyword` に対応する Lucide Icons のアイコン名をコメント（`<!-- icon: {image_keyword} -->`）として埋め込む。
3. WHEN すべての Step（1〜3）が完了したとき、THE App SHALL 完成画面を表示し、`marp_markdown` を `@marp-team/marp-core` を使用してスライドとしてレンダリングし、1ページずつ表示する。
4. THE App SHALL 完成画面でスライドの左右に「前へ」「次へ」のナビゲーションボタンを表示し、Child_User がスライドをページ送りできるようにする。
5. THE App SHALL 完成画面で「もう一度つくる」ボタンを表示する。WHEN Child_User がそのボタンをタップしたとき、THE App SHALL すべてのスライドデータおよび会話履歴をリセットし、Grade_Selector 画面に戻る。
6. THE Slide_Exporter SHALL `marp_markdown` の内容を、対象の Grade に応じた漢字制限（要件5の各基準）を適用して生成する。
7. THE App SHALL 完成画面でスライドの下部に `marp_markdown` のソーステキストをコピーできる「コピー」ボタンを表示する。WHEN Child_User がそのボタンをタップしたとき、THE App SHALL `marp_markdown` の全文をクリップボードにコピーする。
8. THE App SHALL 完成画面でスライドビューアーの下部に Presentation_Guide セクションを表示する。現在表示中のスライドページに対応する `presentation_guide` の `script`（台本）と `advice`（アドバイス）を表示し、スライドのページ送りに連動して内容を切り替える。
9. THE App SHALL Presentation_Guide セクションにおいて、`script` を「このページで はなすこと」というラベルの下に表示し、`advice` を「プレゼンの コツ」というラベルの下に視覚的に区別して表示する。
10. THE Slide_Exporter SHALL `presentation_guide` の各要素の `script` および `advice` を、対象の Grade に応じた漢字制限（要件5の各基準）を適用して生成する。
11. THE Slide_Exporter SHALL `presentation_guide` の `advice` に、プレゼンの構造上そのページが果たす役割（導入で聞き手の興味を引く、展開で具体例を使って印象づける、結論で気持ちを伝えてまとめる）を小学生にわかる言葉で含める。

---

### 要件8：会話履歴の管理

**ユーザーストーリー：** システムとして、これまでの会話コンテキストをAPIリクエストに含めたい。そうすることで、AIが文脈に沿った一貫性のある次の質問とスライドを生成できるようにしたい。

#### 受入基準

1. THE App SHALL 各リクエスト時に、これまでのすべての発話履歴（`history` 配列）を Slide_API に送信する。
2. THE App SHALL `history` 配列に、`role`（`"assistant"` または `"user"`）と `content`（発話内容の文字列）を持つオブジェクトとして各発話を追加する。
3. WHEN Slide_API からレスポンスを受信したとき、THE App SHALL Child_User の発話を `role: "user"` として、続けて AI_Character の発話（`ai_response_voice`）を `role: "assistant"` として `history` 配列に追記する。
4. WHEN `history` 配列のエントリ数が 20 件を超えたとき、THE App SHALL 最古のエントリから順に削除して 20 件以内に収める。
5. WHEN Grade_Selector 画面が表示されたとき、THE App SHALL `history` 配列を空配列に初期化する。

---

### 要件9：モック動作モード（フロントエンド単体動作）

**ユーザーストーリー：** 開発者として、AWSバックエンドなしでフロントエンドの動作を確認したい。そうすることで、開発初期段階からUIと音声認識の動作をテストできるようにしたい。

#### 受入基準

1. WHERE 環境変数 `VITE_MOCK_MODE` の値が `"true"` のとき、THE App SHALL Slide_API への実際のHTTPリクエストを送信せず、代わりにあらかじめ定義されたモックJSONデータをレスポンスとして使用する。
2. WHERE モック動作モードが有効のとき、THE App SHALL `current_step` の値（1, 2, 3）に対応する3種類のモックレスポンスデータを用意し、ステップ番号に応じて対応するモックデータを返す。Step 3 のモックデータには非空の `marp_markdown` フィールド（Marp 形式の Markdown テキスト3ページ分）および3要素の `presentation_guide` 配列（各要素に `page`, `script`, `advice` を含む）を含める。Step 1, 2 のモックデータでは `marp_markdown` は空文字列、`presentation_guide` は空配列とする。
3. THE App SHALL `VITE_MOCK_MODE` が未設定または `"true"` 以外の値の場合、本番モード（実際の Slide_API への接続）として動作する。

---

### 要件10：アクセシビリティと使いやすさ

**ユーザーストーリー：** 子どもとして、文字が読めなくてもアプリを使いたい。そうすることで、ひらがなが苦手な子どもでもスライド作りを楽しめるようにしたい。

#### 受入基準

1. THE App SHALL Grade_Selector 画面・メイン画面・完成画面のすべての主要なUIラベル・ボタンテキストを、16px以上のフォントサイズで表示する。
2. THE App SHALL Grade_Selector 画面・メイン画面・完成画面のすべてのナビゲーション操作（学年選択、マイクボタン、「もう一度つくる」ボタンを含む）を、マウスクリックまたはタッチ操作のみで完結できるよう設計する（キーボード入力を必須としない）。
3. WHILE AI_Character が発話中〜発話終了までのあいだ、THE App SHALL `ai_response_voice` のテキストを画面上にも同時に表示し、音声が聞こえない状況でも内容を確認できるようにする。
4. THE App SHALL スライドおよびUI全体のフォントとして、`Rounded Mplus 1c`、`BIZ UDPGothic`、`sans-serif` の優先順位でフォールバックするフォントスタックを適用する。
