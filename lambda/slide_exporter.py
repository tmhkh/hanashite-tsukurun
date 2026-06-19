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
- 先頭に YAML フロントマター: ---\\nmarp: true\\ntheme: default\\npaginate: true\\n---
- 各スライドを --- で区切った3ページ構成
- 各ページに対応するステップの slide_title を見出し（#）、slide_text を本文
- image_keyword を <!-- icon: {keyword} --> コメントとして埋め込む

【プレゼンガイド生成指示】
presentation_guideフィールドに以下の3要素の配列を生成してください：
- page 1: 導入の台本（script）+ 「つかみ」の役割アドバイス（advice）
  - advice: 聞き手の興味を引くための話し方のコツを小学生にわかる言葉で書く
- page 2: 展開の台本（script）+ 「いちばんつたえたいこと」の役割アドバイス（advice）
  - advice: 具体例を使って印象づける方法を小学生にわかる言葉で書く
- page 3: 結論の台本（script）+ 「まとめ」の役割アドバイス（advice）
  - advice: 気持ちを伝えてまとめる方法を小学生にわかる言葉で書く"""
    else:
        return (
            'marp_markdownフィールドは必ず空文字列 "" にしてください。\n'
            "presentation_guideフィールドは必ず空配列 [] にしてください。"
        )
