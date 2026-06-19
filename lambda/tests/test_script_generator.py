"""slide_exporter モジュールのユニットテスト。"""

import pytest
from slide_exporter import build_slide_export_prompt_suffix


class TestBuildSlideExportPromptSuffix:
    """build_slide_export_prompt_suffix のユニットテスト。"""

    # --- current_step == 3 のケース ---

    def test_step3_returns_string(self):
        result = build_slide_export_prompt_suffix(3)
        assert isinstance(result, str)

    def test_step3_is_nonempty(self):
        result = build_slide_export_prompt_suffix(3)
        assert len(result) > 0

    def test_step3_mentions_marp(self):
        """Marp に関する指示が含まれること。"""
        result = build_slide_export_prompt_suffix(3)
        assert "marp" in result.lower() or "Marp" in result

    def test_step3_mentions_presentation_guide(self):
        """presentation_guide フィールドへの指示が含まれること。"""
        result = build_slide_export_prompt_suffix(3)
        assert "presentation_guide" in result

    def test_step3_mentions_marp_markdown(self):
        """marp_markdown フィールドへの指示が含まれること。"""
        result = build_slide_export_prompt_suffix(3)
        assert "marp_markdown" in result

    def test_step3_mentions_script_field(self):
        """script（台本）に関する指示が含まれること。"""
        result = build_slide_export_prompt_suffix(3)
        assert "script" in result

    def test_step3_mentions_advice_field(self):
        """advice（アドバイス）に関する指示が含まれること。"""
        result = build_slide_export_prompt_suffix(3)
        assert "advice" in result

    # --- current_step != 3 のケース ---

    def test_step1_returns_string(self):
        result = build_slide_export_prompt_suffix(1)
        assert isinstance(result, str)

    def test_step1_is_nonempty(self):
        result = build_slide_export_prompt_suffix(1)
        assert len(result) > 0

    def test_step1_instructs_empty_marp_markdown(self):
        """step1 では marp_markdown を空文字列にする指示が含まれること。"""
        result = build_slide_export_prompt_suffix(1)
        assert "marp_markdown" in result
        assert '""' in result or "空文字" in result

    def test_step1_instructs_empty_presentation_guide(self):
        """step1 では presentation_guide を空配列にする指示が含まれること。"""
        result = build_slide_export_prompt_suffix(1)
        assert "presentation_guide" in result
        assert "[]" in result or "空配列" in result

    def test_step2_instructs_empty_marp_markdown(self):
        """step2 では marp_markdown を空文字列にする指示が含まれること。"""
        result = build_slide_export_prompt_suffix(2)
        assert "marp_markdown" in result
        assert '""' in result or "空文字" in result

    # --- step1 と step2 の返値が一致すること ---

    def test_step1_and_step2_return_same_value(self):
        assert build_slide_export_prompt_suffix(1) == build_slide_export_prompt_suffix(2)

    # --- step3 と step1/2 の返値が異なること ---

    def test_step3_differs_from_step1(self):
        assert build_slide_export_prompt_suffix(3) != build_slide_export_prompt_suffix(1)

    def test_step3_differs_from_step2(self):
        assert build_slide_export_prompt_suffix(3) != build_slide_export_prompt_suffix(2)
