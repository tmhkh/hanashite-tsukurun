# Implementation Plan: Secure Deployment

## Overview

本実装プランは「はなして・つくるん」アプリに認証・認可・静的ホスティングのインフラを追加する。CDK スタックの構築から始め、フロントエンドの認証レイヤーを実装し、既存APIサービスへの認証ヘッダー付与、Lambda のモデルID環境変数化を行い、最後に結合して動作確認する。

## Tasks

- [x] 1. CDK プロジェクトのセットアップとコアインフラ定義
  - [x] 1.1 CDK プロジェクトを初期化する
    - `hanashite-tsukurun/infra/` ディレクトリを作成し、CDK TypeScript プロジェクトを初期化する
    - `package.json`, `tsconfig.json`, `cdk.json` を作成
    - `cdk.json` に `stackName` と `authMethod` コンテキストパラメータを定義する
    - _Requirements: 6.2_

  - [x] 1.2 Cognito User Pool と App Client を定義する
    - `infra/lib/hanashite-tsukurun-stack.ts` に Cognito User Pool を作成
    - セルフサインアップ無効、クライアントシークレットなし、USER_PASSWORD_AUTH フローを設定
    - IDトークン有効期限1時間、リフレッシュトークン有効期限30日を設定
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [x] 1.3 S3 バケットと CloudFront ディストリビューションを定義する
    - S3 バケットを作成し、パブリックアクセスを全ブロック
    - Origin Access Control (OAC) を設定
    - CloudFront Distribution を作成し、HTTPS リダイレクト、デフォルトルートオブジェクト `index.html`、404 カスタムエラーレスポンスを設定
    - BucketDeployment で `dist/` を S3 にアップロードする設定を追加
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.7_

  - [x] 1.4 Lambda 関数と API Gateway (HTTP API) を定義する
    - Lambda 関数を Python 3.13 ランタイム、30秒タイムアウトで定義
    - 環境変数 `BEDROCK_MODEL_ID` を設定
    - Bedrock `InvokeModel` 権限の IAM ポリシーを付与
    - HTTP API (API Gateway v2) を作成し、Lambda プロキシ統合を設定
    - `POST /api/create-slide` ルートを定義
    - _Requirements: 4.3, 6.1, 6.3, 6.4, 6.5_

  - [x] 1.5 Cognito JWT Authorizer を API Gateway に設定する
    - HTTP API に Cognito JWT Authorizer を追加
    - `POST /api/create-slide` ルートに Authorizer を適用
    - OPTIONS プリフライトリクエストは認証不要とする CORS 設定を追加
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 1.6 リソース命名規則を適用する
    - すべてのリソースにスタック名プレフィックスを適用
    - _Requirements: 6.6_

  - [ ]* 1.7 CDK スナップショットテストを作成する
    - `infra/test/stack.test.ts` を作成
    - Template.fromStack を使って各リソースの存在と設定を検証
    - Cognito: セルフサインアップ無効、トークン有効期限
    - API Gateway: JWT Authorizer 設定
    - Lambda: ランタイム、タイムアウト、環境変数
    - S3: パブリックアクセスブロック
    - CloudFront: HTTPS リダイレクト、カスタムエラーレスポンス
    - _Requirements: 1.1, 1.2, 1.6, 3.1, 4.3, 5.1, 5.2, 5.4, 5.5, 6.3, 6.4, 6.5_

- [x] 2. Checkpoint - CDK スタック定義の確認
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Lambda のモデルID環境変数化
  - [x] 3.1 Lambda handler のモデルID読み取りを環境変数化する
    - `lambda/handler.py`（または `lambda/bedrock_client.py`）の `DEFAULT_MODEL_ID` を `os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")` に変更
    - _Requirements: 4.1, 4.2_

  - [ ]* 3.2 Lambda のモデルID環境変数テストを追加する
    - `lambda/test_handler.py` に環境変数読み取りテストを追加
    - 環境変数設定時にその値を使用することを検証
    - 環境変数未設定時にデフォルト値を使用することを検証
    - _Requirements: 4.1, 4.2_

- [x] 4. フロントエンド認証レイヤーの実装
  - [x] 4.1 Cognito サービスモジュールを作成する
    - `src/services/cognitoService.ts` を新規作成
    - `@aws-sdk/client-cognito-identity-provider` をインストール
    - `initiateAuth`, `refreshToken`, `signOut` 関数を実装
    - 環境変数 `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_REGION` を読み取る
    - _Requirements: 1.5, 2.3, 2.5_

  - [x] 4.2 AuthContext を作成する
    - `src/contexts/AuthContext.tsx` を新規作成
    - `AuthState` インターフェース（isAuthenticated, isLoading, idToken, error）を定義
    - `AuthContextValue` インターフェース（login, logout, getToken）を定義
    - `useAuth` カスタムフックをエクスポート
    - IDトークンをセッションストレージに保持、リフレッシュトークンはメモリ内変数に保持
    - アプリ起動時にセッション確認（リフレッシュトークンによる自動復帰）を実装
    - _Requirements: 7.1, 7.2, 7.4, 2.5, 2.6, 2.7_

  - [x] 4.3 LoginScreen コンポーネントを作成する
    - `src/components/LoginScreen/LoginScreen.tsx` を新規作成
    - パスワード認証モード: ユーザー名フィールド、パスワードフィールド、ログインボタンを表示
    - 認証成功時に `onLoginSuccess` コールバックを呼び出す
    - 認証失敗時に「ログインに失敗しました」エラーメッセージを表示
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 4.4 App.tsx に AuthProvider と認証ガードを統合する
    - `App.tsx` を AuthProvider でラップ
    - 未認証時は LoginScreen を表示し、Grade_Selector 以降へのアクセスを遮断
    - 認証済み時はログアウトボタンを表示
    - ログアウトボタンクリック時にトークン破棄と LoginScreen 遷移を実行
    - _Requirements: 2.1, 7.3, 7.4_

  - [x] 4.5 VITE_MOCK_MODE 対応を追加する
    - `VITE_MOCK_MODE=true` の場合、認証チェックをスキップし直接 Grade_Selector を表示
    - `VITE_MOCK_MODE=true` の場合、API リクエストにトークンを付与しない
    - `VITE_MOCK_MODE` 未設定時は認証必須とする
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 4.6 AuthContext のユニットテストを作成する
    - `src/contexts/AuthContext.test.tsx` を新規作成
    - Cognito SDK をモックし、以下を検証:
      - 未認証時は isAuthenticated: false
      - ログイン成功時にトークンを保持し isAuthenticated: true
      - ログイン失敗時にエラーメッセージを設定
      - トークン期限切れ時にリフレッシュを試行
      - リフレッシュ失敗時に isAuthenticated: false に遷移
      - ログアウト時にトークンを全破棄
    - _Requirements: 7.1, 7.2, 7.4, 2.5, 2.6_

  - [ ]* 4.7 LoginScreen のユニットテストを作成する
    - `src/components/LoginScreen/LoginScreen.test.tsx` を新規作成
    - ユーザー名・パスワードフィールドとログインボタンの表示を検証
    - 認証成功時に onLoginSuccess を呼び出すことを検証
    - 認証失敗時に「ログインに失敗しました」メッセージを表示することを検証
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 4.8 VITE_MOCK_MODE 共存テストを作成する
    - VITE_MOCK_MODE=true: 認証チェックスキップ、LoginScreen 非表示を検証
    - VITE_MOCK_MODE=true: API リクエストにトークン付与しないことを検証
    - VITE_MOCK_MODE 未設定: 認証必須、未認証時 LoginScreen 表示を検証
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 5. Checkpoint - フロントエンド認証レイヤーの確認
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. API サービスへの認証ヘッダー統合
  - [x] 6.1 slideApiService.ts に Authorization ヘッダーを追加する
    - `callSlideApi` 関数に `token` パラメータを追加（またはコンテキストから取得）
    - 本番モード: `Authorization: Bearer <token>` ヘッダーを付与
    - モックモード: トークンなしで既存ロジックを維持
    - 401 レスポンス受信時に `AuthError` をスローする
    - _Requirements: 3.5, 7.5_

  - [x] 6.2 useSlideApi フックに認証エラーハンドリングを追加する
    - `AuthError` 受信時に AuthContext の状態をリセットし LoginScreen に遷移させる
    - `useAuth` フックの `getToken` を使って API 呼び出し時にトークンを取得
    - _Requirements: 7.5, 3.5_

  - [ ]* 6.3 slideApiService のユニットテストを更新する
    - 本番モード: Authorization ヘッダーが付与されることを検証
    - モックモード: Authorization ヘッダーが付与されないことを検証
    - 401 レスポンスで AuthError がスローされることを検証
    - _Requirements: 3.5, 8.2_

- [x] 7. フロントエンド環境変数の設定
  - [x] 7.1 環境変数ファイルを更新する
    - `.env.development` に `VITE_MOCK_MODE=true` を設定（ローカル開発用）
    - `.env.production` を新規作成し、`VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_REGION`, `VITE_API_ENDPOINT` のプレースホルダーを記載
    - `vite-env.d.ts` に環境変数の型定義を追加
    - _Requirements: 8.1, 8.3_

- [x] 8. 全体結合と最終確認
  - [x] 8.1 CDK スタックにフロントエンド環境変数の出力を追加する
    - CfnOutput で Cognito User Pool ID、Client ID、API Gateway エンドポイント URL を出力
    - デプロイ後に `.env.production` に設定値を記入するための参照情報とする
    - _Requirements: 6.1, 6.7_

  - [x] 8.2 README にデプロイ手順を追記する
    - CDK デプロイの前提条件（`pnpm build` でフロントエンドビルド済み）を明記
    - `cdk deploy` コマンドの実行手順を記載
    - デプロイ後の Cognito ユーザー作成手順を記載
    - _Requirements: 6.7_

- [x] 9. Final checkpoint - 全テスト通過の確認
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- テストタスク（`*` マーク付き）はオプションであり、MVP 優先時はスキップ可能
- 各タスクは具体的な要件にトレーサビリティを持つ
- チェックポイントでインクリメンタルに検証を実施
- PBT はこのフィーチャーには適用しない（IaC・認証フロー・UI状態管理のため）
- CDK テストはスナップショットテスト + assertions を使用
- フロントエンドテストは Vitest + @testing-library/react を使用
- Lambda テストは pytest を使用

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "3.2"] },
    { "id": 2, "tasks": ["1.5", "1.6", "4.1"] },
    { "id": 3, "tasks": ["1.7", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.5"] },
    { "id": 5, "tasks": ["4.4", "4.6", "4.7", "4.8"] },
    { "id": 6, "tasks": ["6.1", "7.1"] },
    { "id": 7, "tasks": ["6.2", "6.3"] },
    { "id": 8, "tasks": ["8.1", "8.2"] }
  ]
}
```
