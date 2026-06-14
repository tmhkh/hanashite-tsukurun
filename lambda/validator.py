"""リクエストバリデーションモジュール。

Slide_API へのリクエストボディを検証し、有効・無効を判定する。
"""

from __future__ import annotations

VALID_GRADES = {
    "grade0", "grade1", "grade2", "grade3",
    "grade4", "grade5", "grade6", "grade7",
}

VALID_STEPS = {1, 2, 3}

REQUIRED_FIELDS = {"grade", "current_step", "user_speech", "history"}


def validate_request(body: dict) -> tuple[bool, str]:
    """リクエストボディのバリデーションを行う。

    以下の条件のいずれかに該当する場合、無効と判定する:
    - 必須フィールド（grade, current_step, user_speech, history）のいずれかが欠如している
    - grade が "grade0"〜"grade7" の範囲外
    - current_step が 1, 2, 3 以外の値

    Args:
        body: リクエストボディのdict

    Returns:
        有効な場合は (True, "")、無効な場合は (False, "invalid request")
    """
    # 必須フィールドの存在チェック
    if not all(field in body for field in REQUIRED_FIELDS):
        return False, "invalid request"

    # grade の値域チェック
    if body["grade"] not in VALID_GRADES:
        return False, "invalid request"

    # current_step の値域チェック
    if body["current_step"] not in VALID_STEPS:
        return False, "invalid request"

    return True, ""
