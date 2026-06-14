"""Script_Generator モジュール。

ステップ番号に応じて、Bedrock へのプロンプトに追加するサフィックスを生成する。
- current_step == 3 のとき: 100〜400 文字の発表台本生成指示
- current_step != 3 のとき: script フィールドを空文字列にする指示
"""


def build_script_prompt_suffix(current_step: int) -> str:
    """ステップに応じたスクリプト生成プロンプトサフィックスを返す。

    Args:
        current_step: 現在のスライド作成ステップ（1, 2, または 3）。

    Returns:
        current_step が 3 の場合は 100 文字以上 400 文字以内の発表用スピーチ台本
        を生成するよう指示するプロンプト文字列。
        current_step が 3 以外の場合は script フィールドを空文字列にするよう
        指示するプロンプト文字列。
    """
    if current_step == 3:
        return (
            "また、scriptフィールドに100文字以上400文字以内の発表用スピーチ台本を生成してください。"
        )
    else:
        return 'scriptフィールドは必ず空文字列 "" にしてください。'
