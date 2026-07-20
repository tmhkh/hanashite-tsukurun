# hanashite-tsukurun プロジェクト固有ルール

## 1. UIデザイン

- UIはグラスモルフィズム（Glassmorphism）で統一する
  - 半透明背景（`rgba(255, 255, 255, 0.15〜0.25)`）+ `backdrop-filter: blur()`
  - 白い半透明ボーダー（`border: 1px solid rgba(255, 255, 255, 0.3〜0.4)`）
  - テキストは白系 + `textShadow` で可読性を確保
  - 角丸は大きめ（16〜32px）
  - `box-shadow` でフロート感を演出
- MUI は使用しない（このプロジェクトはインラインスタイル + CSS で構成）
- `index.css` に定義されたCSS変数（`--glass-*` トークン）を活用する

## 2. その他

- 上記以外はすべてワークスペースの共通ルール（`.kiro/steering/rules.md`）に従う
