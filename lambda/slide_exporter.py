"""Slide_Exporter モジュール。

ステップ番号に応じて、Bedrock へのプロンプトに追加するサフィックスを生成する。
- current_step == 3 のとき: Marp Markdown + presentation_guide 生成指示
- current_step != 3 のとき: marp_markdown を空文字列、presentation_guide を空配列にする指示

Requirements: 7.1, 7.2, 7.6, 7.10, 7.11
"""


def build_slide_export_prompt_suffix(current_step: int) -> str:
    """ステップに応じたスライドエクスポート用プロンプトサフィックスを返す。

    Args:
        current_step: 現在のスライド作成ステップ（1, 2, または 3）。

    Returns:
        current_step が 3 の場合は Marp Markdown と presentation_guide を
        生成するよう指示するプロンプト文字列。
        current_step が 3 以外の場合は marp_markdown を空文字列、
        presentation_guide を空配列にするよう指示するプロンプト文字列。
    """
    if current_step == 3:
        return """【Marp スライド生成指示】
marp_markdownフィールドに以下の形式でMarp Markdownを生成してください：
- 先頭に YAML フロントマター: ---\\nmarp: true\\ntheme: hanashite-pop\\npaginate: true\\nheader: "{発表テーマタイトル}"\\nfooter: "わたしの はっぴょう"\\n---
- 各スライドを --- で区切った3ページ構成
- 各ページに対応するステップの slide_title を見出し（#）、slide_text を本文
- image_keyword を <!-- icon: {keyword} --> コメントとして埋め込む

【レイアウトバリエーション指示】
- ページ1（つかみ）: Marp ディレクティブ `<!-- _class: lead -->` を適用。タイトル大きく中央配置、アイコン大サイズ表示
- ページ2（なかみ）: Marp ディレクティブ `<!-- _class: two-column -->` を適用。左カラムに slide_text 本文、右カラムに image_keyword アイコン/イラスト配置
- ページ3（まとめ）: グラデーション背景＋中央配置テキスト。`<!-- _class: centered -->` を適用、アイコン小サイズ

【テキスト装飾指示】
- 本文テキスト内の重要キーワードに太字（`**キーワード**`）を自動適用
- Child_User の発話に基づき適切な箇所に引用記法（`>`）を使用してメッセージ性を強調
- 各ページの内容に関連する絵文字を本文中に1つ以上自動挿入

【プレゼンガイド生成指示】
presentation_guideフィールドに以下の3要素の配列を生成してください：
- page 1: 導入の台本（script）+ 「つかみ」の役割アドバイス（advice）
  - advice例: 聞き手の興味を引くための話し方のコツを小学生にわかる言葉で
- page 2: 展開の台本（script）+ 「いちばんつたえたいこと」の役割アドバイス（advice）
  - advice例: 具体例を使って印象づける方法を小学生にわかる言葉で
- page 3: 結論の台本（script）+ 「まとめ」の役割アドバイス（advice）
  - advice例: 気持ちを伝えてまとめる方法を小学生にわかる言葉で

【ポジティブフィードバック生成指示】
completion_feedbackフィールドに、Child_User の発表内容に対するポジティブフィードバックを生成してください：
- AI_Character（優しい先生）の口調で記述
- テーマ選び（Step 1）への具体的な褒め言葉を1つ以上含む
- 詳細説明（Step 2）への具体的な褒め言葉を1つ以上含む
- まとめ（Step 3）への具体的な褒め言葉を1つ以上含む
- Child_User の実際の発話内容に基づいた具体的な表現を使用する"""
    else:
        return (
            'marp_markdownフィールドは必ず空文字列 "" にしてください。\n'
            "presentation_guideフィールドは必ず空配列 [] にしてください。\n"
            'completion_feedbackフィールドは必ず空文字列 "" にしてください。'
        )
