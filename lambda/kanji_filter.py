"""Kanji_Filter: 学年別漢字制限プロンプト指示生成モジュール。

grade 区分に応じて Bedrock_Client へ渡すプロンプト指示文字列を返す。
`slide_text` と `ai_response_voice` の両フィールドに同一の制限を適用する。
"""

from __future__ import annotations

# 各 grade に対応するベース指示文字列
_KANJI_INSTRUCTIONS: dict[str, str] = {
    "grade0": "漢字を一切使わず、ひらがな・カタカナのみで出力してください。",
    "grade1": "文部科学省指定の小学1年生配当漢字（80字）のみ使用してください。それ以外の漢字はひらがなで書いてください。",
    "grade2": "文部科学省指定の小学1〜2年生配当漢字（計240字）のみ使用してください。",
    "grade3": "文部科学省指定の小学1〜3年生配当漢字（計440字）のみ使用してください。",
    "grade4": "文部科学省指定の小学1〜4年生配当漢字（計640字）のみ使用してください。",
    "grade5": "文部科学省指定の小学1〜5年生配当漢字（計825字）のみ使用してください。",
    "grade6": "文部科学省指定の小学1〜6年生配当漢字（計1026字）のみ使用してください。",
    "grade7": "常用漢字（2136字）の範囲内で漢字を自由に使用してください。",
}

# 有効な grade 値のセット
VALID_GRADES: frozenset[str] = frozenset(_KANJI_INSTRUCTIONS.keys())


def get_kanji_instruction(grade: str) -> str:
    """学年区分に対応する漢字制限プロンプト指示文字列を返す。

    返り値の指示文字列は ``slide_text`` と ``ai_response_voice`` の
    両フィールドに同一の制限を適用するよう明示した内容となっている。

    Args:
        grade: 学年区分文字列。"grade0"〜"grade7" のいずれか。

    Returns:
        Bedrock_Client プロンプトに埋め込む漢字制限指示文字列。

    Raises:
        ValueError: ``grade`` が "grade0"〜"grade7" の範囲外の場合。
    """
    if grade not in _KANJI_INSTRUCTIONS:
        raise ValueError(
            f"無効な grade 値です: '{grade}'。"
            f"有効な値は {sorted(VALID_GRADES)} のいずれかです。"
        )

    base = _KANJI_INSTRUCTIONS[grade]

    # slide_text と ai_response_voice の両フィールドへの適用を明示する
    return (
        f"【漢字制限】\n"
        f"{base}\n"
        f"この制限は「slide_text」と「ai_response_voice」の両フィールドに同様に適用してください。"
    )
