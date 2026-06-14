from __future__ import annotations

from typing import List, Literal
from typing_extensions import TypedDict


class HistoryEntry(TypedDict):
    """会話履歴の1エントリ。"""

    role: Literal["user", "assistant"]
    content: str


class SlideRequest(TypedDict):
    """Slide_API へのリクエスト型。

    Attributes:
        grade: 学年区分（例: "grade0" 〜 "grade7"）
        current_step: 現在のステップ（1, 2, または 3）
        user_speech: ユーザーの音声入力テキスト（1文字以上）
        history: 会話履歴エントリのリスト（最大 20 件）
    """

    grade: str
    current_step: int
    user_speech: str
    history: List[HistoryEntry]


class SlideResponse(TypedDict):
    """Slide_API からのレスポンス型。

    Attributes:
        slide_title: スライドのタイトル
        slide_text: スライドの本文テキスト
        image_keyword: スライドに対応する画像キーワード（英単語）
        ai_response_voice: AIキャラクターが読み上げる応答テキスト
        next_step: 次のステップ番号（2, 3, または 4。4 は完成を意味する）
        script: 発表台本（step 3 のみ 100〜400 文字、それ以外は空文字列）
    """

    slide_title: str
    slide_text: str
    image_keyword: str
    ai_response_voice: str
    next_step: int
    script: str
