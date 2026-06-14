"""script_generator モジュールのユニットテスト。"""

import pytest
from script_generator import build_script_prompt_suffix


class TestBuildScriptPromptSuffix:
    """build_script_prompt_suffix のユニットテスト。"""

    # --- current_step == 3 のケース ---

    def test_step3_returns_string(self):
        result = build_script_prompt_suffix(3)
        assert isinstance(result, str)

    def test_step3_is_nonempty(self):
        result = build_script_prompt_suffix(3)
        assert len(result) > 0

    def test_step3_mentions_100_chars(self):
        """100文字以上という指示が含まれること。"""
        result = build_script_prompt_suffix(3)
        assert "100文字" in result

    def test_step3_mentions_400_chars(self):
        """400文字以内という指示が含まれること。"""
        result = build_script_prompt_suffix(3)
        assert "400文字" in result

    def test_step3_mentions_script_field(self):
        """scriptフィールドへの指示が含まれること。"""
        result = build_script_prompt_suffix(3)
        assert "script" in result

    # --- current_step != 3 のケース ---

    def test_step1_returns_string(self):
        result = build_script_prompt_suffix(1)
        assert isinstance(result, str)

    def test_step1_is_nonempty(self):
        result = build_script_prompt_suffix(1)
        assert len(result) > 0

    def test_step1_instructs_empty_string(self):
        """step1 では空文字列にする指示が含まれること。"""
        result = build_script_prompt_suffix(1)
        assert '""' in result or "空文字" in result

    def test_step2_instructs_empty_string(self):
        """step2 では空文字列にする指示が含まれること。"""
        result = build_script_prompt_suffix(2)
        assert '""' in result or "空文字" in result

    def test_step1_mentions_script_field(self):
        result = build_script_prompt_suffix(1)
        assert "script" in result

    def test_step2_mentions_script_field(self):
        result = build_script_prompt_suffix(2)
        assert "script" in result

    # --- step1 と step2 の返値が一致すること ---

    def test_step1_and_step2_return_same_value(self):
        assert build_script_prompt_suffix(1) == build_script_prompt_suffix(2)

    # --- step3 と step1/2 の返値が異なること ---

    def test_step3_differs_from_step1(self):
        assert build_script_prompt_suffix(3) != build_script_prompt_suffix(1)

    def test_step3_differs_from_step2(self):
        assert build_script_prompt_suffix(3) != build_script_prompt_suffix(2)
