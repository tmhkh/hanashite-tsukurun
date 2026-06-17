# はなして・つくるん

音声入力で子ども向けプレゼンテーションスライドを自動生成する Web アプリケーション。
Amazon Bedrock（Claude 3 Haiku）を活用し、学年に応じた漢字レベルでスライドを作成します。

## ローカル開発

### セットアップ

```bash
pnpm install
```

### 開発サーバー起動

モックモード（`VITE_MOCK_MODE=true`）で起動するため、AWS 環境なしで開発可能です。

```bash
pnpm dev
```

### テスト実行

フロントエンドテスト（Vitest）:

```bash
pnpm test
```

CDK インフラテスト（Jest）:

```bash
cd infra && npx jest
```

Lambda テスト（pytest）:

```bash
cd lambda && pytest
```

---

## デプロイ手順

### 前提条件

- **Node.js** 18 以上
- **pnpm** インストール済み
- **AWS CLI** 設定済み（`aws configure` でリージョン・クレデンシャルを設定）
- **AWS CDK CLI**（`npm install -g aws-cdk` またはプロジェクト内の `npx cdk` を使用）
- CDK ブートストラップ完了（初回のみ `cdk bootstrap` を実行）

### Step 1: フロントエンドビルド

CDK デプロイでは `dist/` ディレクトリの内容を S3 にアップロードします。
**デプロイ前に必ずフロントエンドをビルドしてください。**

```bash
pnpm build
```

### Step 2: CDK デプロイ

```bash
cd infra
npx cdk deploy
```

初回デプロイ時は IAM リソース作成の確認プロンプトが表示されます。`y` を入力して続行してください。

### Step 3: デプロイ出力値の確認

デプロイ完了後、以下の CfnOutput が表示されます:

- `UserPoolId` — Cognito User Pool ID
- `UserPoolClientId` — Cognito App Client ID
- `ApiEndpoint` — API Gateway エンドポイント URL
- `CloudFrontUrl` — CloudFront ディストリビューション URL

### Step 4: `.env.production` に出力値を設定

プロジェクトルートの `.env.production` に CfnOutput の値を記入します:

```env
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_XXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=ap-northeast-1
VITE_API_ENDPOINT=https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com
```

### Step 5: 再ビルド＆再デプロイ

環境変数をフロントエンドに埋め込むため、再度ビルドとデプロイを行います:

```bash
cd ..
pnpm build
cd infra
npx cdk deploy
```

---

## Cognito ユーザー作成

デプロイ後、AWS CLI で管理者ユーザーを作成します。

### ユーザーの作成

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username <USERNAME> \
  --temporary-password <TEMP_PASSWORD>
```

`<USER_POOL_ID>` は Step 3 で取得した値に置き換えてください。

### 初回ログイン後のパスワード変更

初回ログイン時、Cognito は `NEW_PASSWORD_REQUIRED` チャレンジを返します。
アプリの Login 画面で初回ログインを行い、新しいパスワードを設定してください。

または、AWS CLI でパスワードを確定させることもできます:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id <USER_POOL_ID> \
  --username <USERNAME> \
  --password <NEW_PASSWORD> \
  --permanent
```

---

## プロジェクト構成

```
hanashite-tsukurun/
├── src/           # React フロントエンド
├── lambda/        # AWS Lambda バックエンド (Python)
├── infra/         # AWS CDK インフラ定義 (TypeScript)
├── dist/          # フロントエンドビルド成果物
└── package.json   # フロントエンド依存関係
```
