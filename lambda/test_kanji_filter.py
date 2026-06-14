"""kanji_filter モジュールのユニットテスト。"""

from __future__ import annotations

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from kanji_filter import VALID_GRADES, get_kanji_instruction


# ---------------------------------------------------------------------------
# ユニットテスト: 各 grade の返り値を個別に検証
# ---------------------------------------------------------------------------

class TestGetKanjiInstruction:
    """get_kanji_instruction の具体的な動作を検証する。"""

    def test_grade0_contains_hiragana_katakana_only_instruction(self) -> None:
        result = get_kanji_instruction("grade0")
        assert "漢字を一切使わず" in result
        assert "ひらがな・カタカナのみ" in result

    def test_grade1_contains_80_kanji_instruction(self) -> None:
        result = get_kanji_instruction("grade1")
        assert "小学1年生配当漢字（80字）" in result
        assert "ひらがなで書いてください" in result

    def test_grade2_contains_240_kanji_instruction(self) -> None:
        result = get_kanji_instruction("grade2")
        assert "小学1〜2年生配当漢字（計240字）" in result

    def test_grade3_contains_440_kanji_instruction(self) -> None:
        result = get_kanji_instruction("grade3")
        assert "小学1〜3年生配当漢字（計440字）" in result

    def test_grade4_contains_640_kanji_instruction(self) -> None:
        result = get_kanji_instruction("grade4")
        assert "小学1〜4年生配当漢字（計640字）" in result

    def test_grade5_contains_825_kanji_instruction(self) -> None:
        result = get_kanji_instruction("grade5")
        assert "小学1〜5年生配当漢字（計825字）" in result

    def test_grade6_contains_1026_kanji_instruction(self) -> None:
        result = get_kanji_instruction("grade6")
        assert "小学1〜6年生配当漢字（計1026字）" in result

    def test_grade7_contains_joyo_kanji_instruction(self) -> None:
        result = get_kanji_instruction("grade7")
        assert "常用漢字（2136字）" in result

    def test_all_grades_contain_slide_text_field_reference(self) -> None:
        """全 grade の返り値が slide_text フィールドへの適用を明示していることを確認。"""
        for grade in VALID_GRADES:
            result = get_kanji_instruction(grade)
            assert "slide_text" in result, f"{grade}: slide_text への言及がない"

    def test_all_grades_contain_ai_response_voice_field_reference(self) -> None:
        """全 grade の返り値が ai_response_voice フィールドへの適用を明示していることを確認。"""
        for grade in VALID_GRADES:
            result = get_kanji_instruction(grade)
            assert "ai_response_voice" in result, f"{grade}: ai_response_voice への言及がない"

    def test_invalid_grade_raises_value_error(self) -> None:
        with pytest.raises(ValueError):
            get_kanji_instruction("grade8")

    def test_invalid_empty_string_raises_value_error(self) -> None:
        with pytest.raises(ValueError):
            get_kanji_instruction("")

    def test_invalid_none_raises_value_error(self) -> None:
        with pytest.raises(ValueError):
            get_kanji_instruction(None)  # type: ignore[arg-type]

    def test_returns_non_empty_string_for_all_valid_grades(self) -> None:
        for grade in VALID_GRADES:
            result = get_kanji_instruction(grade)
            assert isinstance(result, str)
            assert len(result) > 0


# ---------------------------------------------------------------------------
# プロパティベーステスト: Property 3（Kanji Constraint Propagation）
# Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
# ---------------------------------------------------------------------------

# 有効な grade 値のリスト
VALID_GRADE_LIST = sorted(VALID_GRADES)


@settings(max_examples=100)
@given(grade=st.sampled_from(VALID_GRADE_LIST))
def test_property3_kanji_constraint_propagation(grade: str) -> None:
    """**Validates: Requirements 5.1〜5.9**

    Property 3: 学年別漢字制限の適用（Kanji Constraint Propagation）

    任意の grade 値（grade0〜grade7）について、
    get_kanji_instruction が返す文字列には:
    1. 空でない漢字制限指示が含まれること
    2. slide_text フィールドへの適用指示が含まれること
    3. ai_response_voice フィールドへの適用指示が含まれること
    """
    result = get_kanji_instruction(grade)

    # 返り値は空でない文字列
    assert isinstance(result, str)
    assert len(result) > 0

    # slide_text への制限適用が明示されていること（要件 5.1〜5.9）
    assert "slide_text" in result

    # ai_response_voice への制限適用が明示されていること（要件 5.9）
    assert "ai_response_voice" in result

    # grade ごとの期待キーワードが含まれること
    expected_keywords: dict[str, str] = {
        "grade0": "ひらがな・カタカナのみ",
        "grade1": "80字",
        "grade2": "240字",
        "grade3": "440字",
        "grade4": "640字",
        "grade5": "825字",
        "grade6": "1026字",
        "grade7": "常用漢字",
    }
    assert expected_keywords[grade] in result, (
        f"grade={grade} の返り値に期待キーワード '{expected_keywords[grade]}' が含まれない"
    )
