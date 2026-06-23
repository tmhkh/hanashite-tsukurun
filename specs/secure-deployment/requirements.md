# Requirements Document

## Introduction

本ドキュメントは「はなして・つくるん」の安全なデプロイメントに関する要件を定義する。既存のReact SPAフロントエンドとAWS Lambda バックエンドに対して、認証・認可の仕組みを追加し、認証済みユーザーのみがBedrock APIを利用できるよう保護する。ユーザーは開発者自身（単一ユーザー）のみとし、AWS Cognitoによるパスキー（WebAuthn/FIDO2）認証を第一選択肢とする。パスキーが技術的に実現困難な場合は、Cognitoのユーザー名・パスワード認証にフォールバックする。また、AIモデルをClaude 3.5 SonnetからClaude 3 Haikuに変更し、インフラストラクチャをIaCで管理する。

---

## Glossary

- **App**: 本Webアプリケーション全体（「はなして・つくるん」）
- **Developer_User**: 本アプリの唯一の利用者である開発者自身
- **Cognito_User_Pool**: AWS Cognito が管理するユーザーディレクトリ。認証情報とトークン発行を担当する
- **Login_Screen**: 認証画面。Developer_User がアプリにアクセスする際に最初に表示されるログインUI
- **Auth_Token**: Cognito が発行するJWTトークン（IDトークンまたはアクセストークン）
- **API_Gateway_Authorizer**: API Gateway に設定されるCognito JWTオーソライザー。Auth_Token を検証しリクエストの許可・拒否を行う
- **Passkey_Auth**: WebAuthn/FIDO2 プロトコルに基づくパスワードレス認証方式
- **Password_Auth**: ユーザー名とパスワードによる従来型認証方式（パスキーが利用不可の場合のフォールバック）
- **Slide_API**: バックエンドのHTTPエンドポイント（`POST /api/create-slide`）
- **Lambda_Handler**: AWS Lambda 上のバックエンド処理関数
- **Bedrock_Client**: Amazon Bedrock（Claude）を呼び出すモジュール
- **CDK_Stack**: AWS CDK によるインフラストラクチャ定義（IaC）
- **CloudFront_Distribution**: 静的ファイルを配信するCDNディストリビューション
- **S3_Bucket**: フロントエンドのビルド成果物を格納するストレージ

---

## Requirements

---

### 要件1：Cognito ユーザープールの構成

**ユーザーストーリー：** 開発者として、AWS Cognitoでユーザーアカウントを管理したい。そうすることで、標準的で安全な認証基盤のもとでアプリにログインできるようにしたい。

#### 受入基準

1. THE CDK_Stack SHALL Cognito_User_Pool を1つ作成し、Developer_User のアカウントを1件のみ登録可能とする。
2. THE Cognito_User_Pool SHALL セルフサインアップを無効化し、管理者のみがユーザーを作成できるよう設定する。
3. THE Cognito_User_Pool SHALL アプリクライアントを1つ作成し、クライアントシークレットなしで構成する（SPAからの利用のため）。
4. WHERE Cognito がパスキー（WebAuthn/FIDO2）認証フローをサポートしている場合、THE Cognito_User_Pool SHALL パスキーを第一認証方式として構成する。
5. WHERE Cognito がパスキー認証をサポートしていない、または技術的に実現困難な場合、THE Cognito_User_Pool SHALL ユーザー名・パスワード認証（USER_PASSWORD_AUTH フロー）を認証方式として構成する。
6. THE Cognito_User_Pool SHALL IDトークンの有効期限を1時間、リフレッシュトークンの有効期限を30日に設定する。

---

### 要件2：ログイン画面

**ユーザーストーリー：** 開発者として、アプリにアクセスしたときにログイン画面を表示したい。そうすることで、認証を完了してからアプリ機能を利用できるようにしたい。

#### 受入基準

1. WHEN Developer_User が未認証状態でアプリのURLにアクセスしたとき、THE App SHALL Login_Screen を表示し、Grade_Selector 画面やメイン画面へのアクセスを遮断する。
2. THE Login_Screen SHALL 認証方式に応じた入力フォームを表示する。パスキー認証の場合はパスキー認証開始ボタンを表示し、パスワード認証の場合はユーザー名フィールドとパスワードフィールドとログインボタンを表示する。
3. WHEN Developer_User が正しい認証情報を提供したとき、THE App SHALL Cognito から Auth_Token を取得し、ブラウザのセッションに保持した上で Grade_Selector 画面に遷移する。
4. IF Developer_User が不正な認証情報を提供した場合、THEN THE Login_Screen SHALL 「ログインに失敗しました」というエラーメッセージを表示し、入力フォームを再表示する。
5. WHEN Auth_Token の有効期限が切れたとき、THE App SHALL リフレッシュトークンを使用してAuth_Token の自動更新を試みる。
6. IF リフレッシュトークンによるトークン更新が失敗した場合、THEN THE App SHALL Login_Screen を表示し、再認証を要求する。
7. THE App SHALL Auth_Token をブラウザのメモリ（JavaScript変数）またはセッションストレージに保持し、ローカルストレージには保存しない。

---

### 要件3：API Gateway 認可

**ユーザーストーリー：** 開発者として、Slide_API を認証済みユーザーのみに制限したい。そうすることで、未認証のリクエストによる不正なBedrock API呼び出しとコスト発生を防止したい。

#### 受入基準

1. THE CDK_Stack SHALL API Gateway に Cognito JWT オーソライザー（API_Gateway_Authorizer）を設定する。
2. THE API_Gateway_Authorizer SHALL Slide_API（`POST /api/create-slide`）へのすべてのリクエストに対して Auth_Token の検証を実施する。
3. WHEN 有効な Auth_Token が Authorization ヘッダーに含まれているリクエストを受信したとき、THE API_Gateway_Authorizer SHALL リクエストを Lambda_Handler に転送する。
4. IF Authorization ヘッダーが欠如している、または Auth_Token が無効もしくは有効期限切れである場合、THEN THE API_Gateway_Authorizer SHALL HTTPステータスコード 401 を返し、Lambda_Handler を呼び出さない。
5. THE App SHALL Slide_API へのすべてのリクエストの Authorization ヘッダーに `Bearer <Auth_Token>` 形式で Auth_Token を付与する。
6. THE API_Gateway_Authorizer SHALL OPTIONS プリフライトリクエストに対しては認証を要求せず、CORS レスポンスを返す。

---

### 要件4：Bedrock モデルの変更

**ユーザーストーリー：** 開発者として、AIモデルをClaude 3 Haikuに変更したい。そうすることで、応答速度とコスト効率を改善したい。

#### 受入基準

1. THE Lambda_Handler SHALL Bedrock_Client を呼び出す際に、モデルIDとして `anthropic.claude-3-haiku-20240307-v1:0` を使用する。
2. THE Lambda_Handler SHALL モデルIDをハードコードではなく環境変数 `BEDROCK_MODEL_ID` から読み取る。環境変数が未設定の場合は `anthropic.claude-3-haiku-20240307-v1:0` をデフォルト値として使用する。
3. THE CDK_Stack SHALL Lambda関数の環境変数 `BEDROCK_MODEL_ID` に `anthropic.claude-3-haiku-20240307-v1:0` を設定する。

---

### 要件5：フロントエンドの静的ホスティング

**ユーザーストーリー：** 開発者として、フロントエンドをHTTPSで安全にホスティングしたい。そうすることで、ユーザーが安全にアプリにアクセスでき、WebAuthnなどのセキュアAPIを利用できるようにしたい。

#### 受入基準

1. THE CDK_Stack SHALL S3_Bucket を作成し、フロントエンドのビルド成果物（`dist/` ディレクトリの内容）を格納する。
2. THE S3_Bucket SHALL パブリックアクセスをすべてブロックし、CloudFront_Distribution からのアクセスのみを許可する（Origin Access Control を使用）。
3. THE CDK_Stack SHALL CloudFront_Distribution を作成し、S3_Bucket をオリジンとして設定する。
4. THE CloudFront_Distribution SHALL HTTPS のみでコンテンツを配信し、HTTP リクエストをHTTPSにリダイレクトする。
5. THE CloudFront_Distribution SHALL SPAルーティングに対応するため、404エラー時にindex.htmlを返すカスタムエラーレスポンスを設定する。
6. THE CDK_Stack SHALL CloudFront_Distribution のデフォルトルートオブジェクトを `index.html` に設定する。

---

### 要件6：IaCによるインフラ管理

**ユーザーストーリー：** 開発者として、すべてのAWSリソースをコードで管理したい。そうすることで、環境の再現性を確保し、変更履歴を追跡できるようにしたい。

#### 受入基準

1. THE CDK_Stack SHALL 以下のAWSリソースをすべて1つのスタック内で定義する：Cognito_User_Pool、API Gateway（HTTP API）、Lambda関数、S3_Bucket、CloudFront_Distribution。
2. THE CDK_Stack SHALL TypeScript で記述する（AWS CDK v2 を使用）。
3. THE CDK_Stack SHALL Lambda関数にAmazon Bedrockの `bedrock:InvokeModel` 権限を付与するIAMポリシーを含める。
4. THE CDK_Stack SHALL Lambda関数のランタイムをPython 3.13に設定し、`lambda/` ディレクトリのコードをデプロイパッケージとして含める。
5. THE CDK_Stack SHALL Lambda関数のタイムアウトを30秒に設定する。
6. THE CDK_Stack SHALL すべてのリソースに対してスタック名をプレフィックスとしたリソース命名規則を適用する。
7. THE CDK_Stack SHALL `cdk deploy` コマンド1回でフロントエンドのビルド成果物のS3アップロードを含むすべてのリソースをデプロイできるよう構成する。

---

### 要件7：フロントエンド認証状態管理

**ユーザーストーリー：** 開発者として、認証状態をアプリ全体で一貫して管理したい。そうすることで、認証切れ時に適切にログイン画面に戻り、セキュリティを維持できるようにしたい。

#### 受入基準

1. THE App SHALL 認証状態を管理するAuthコンテキスト（またはフック）を提供し、アプリ全体から認証状態を参照可能とする。
2. WHEN App が起動したとき、THE App SHALL 既存のセッション（リフレッシュトークン）を確認し、有効であれば自動的に認証済み状態に復帰する。
3. WHILE Developer_User が認証済み状態のとき、THE App SHALL ログアウトボタンを画面上に表示する。
4. WHEN Developer_User がログアウトボタンをクリックしたとき、THE App SHALL Auth_Token とリフレッシュトークンをすべて破棄し、Login_Screen を表示する。
5. WHEN Slide_API からHTTPステータスコード 401 を受信したとき、THE App SHALL 現在のAuth_Token を破棄し、Login_Screen を表示する。

---

### 要件8：VITE_MOCK_MODE との共存

**ユーザーストーリー：** 開発者として、ローカル開発時にはモックモードで認証をバイパスしたい。そうすることで、Cognito環境がなくてもフロントエンド開発を継続できるようにしたい。

#### 受入基準

1. WHERE 環境変数 `VITE_MOCK_MODE` の値が `"true"` のとき、THE App SHALL 認証チェックをスキップし、Login_Screen を表示せずに直接 Grade_Selector 画面を表示する。
2. WHERE 環境変数 `VITE_MOCK_MODE` の値が `"true"` のとき、THE App SHALL Slide_API へのリクエストにAuth_Token を付与せず、モックレスポンスを使用する。
3. WHERE 環境変数 `VITE_MOCK_MODE` が未設定または `"true"` 以外の値の場合、THE App SHALL 認証を必須とし、未認証時は Login_Screen を表示する。

