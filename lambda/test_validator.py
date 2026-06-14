"""validator.py のユニットテストおよびプロパティベーステスト。

**Validates: Requirements 4.8, 5.10**
"""

from __future__ import annotations

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from validator import validate_request

# ---------------------------------------------------------------------------
# ユニットテスト
# ---------------------------------------------------------------------------

VALID_BODY = {
    "grade": "grade1",
    "current_step": 1,
    "user_speech": "いぬがすきです",
    "history": [],
}


class TestValidateRequestValid:
    """有効なリクエストのテスト。"""

    def test_valid_request_returns_true(self):
        ok, msg = validate_request(VALID_BODY)
        assert ok is True
        assert msg == ""

    @pytest.mark.parametrize("grade", [
        "grade0", "grade1", "grade2", "grade3",
        "grade4", "grade5", "grade6", "grade7",
    ])
    def test_all_valid_grades(self, grade):
        body = {**VALID_BODY, "grade": grade}
        ok, msg = validate_request(body)
        assert ok is True
        assert msg == ""

    @pytest.mark.parametrize("step", [1, 2, 3])
    def test_all_valid_steps(self, step):
        body = {**VALID_BODY, "current_step": step}
        ok, msg = validate_request(body)
        assert ok is True
        assert msg == ""

    def test_history_with_entries(self):
        body = {
            **VALID_BODY,
            "history": [
                {"role": "user", "content": "こんにちは"},
                {"role": "assistant", "content": "いっしょにつくろう！"},
            ],
        }
        ok, msg = validate_request(body)
        assert ok is True
        assert msg == ""


class TestValidateRequestInvalidGrade:
    """grade が範囲外の場合のテスト。"""

    @pytest.mark.parametrize("invalid_grade", [
        "grade8", "grade9", "grade-1", "grade", "",
        "GRADE0", "Grade0", "幼稚園", "1", None,
    ])
    def test_invalid_grade_returns_false(self, invalid_grade):
        body = {**VALID_BODY, "grade": invalid_grade}
        ok, msg = validate_request(body)
        assert ok is False
        assert msg == "invalid request"


class TestValidateRequestInvalidStep:
    """current_step が範囲外の場合のテスト。"""

    @pytest.mark.parametrize("invalid_step", [
        0, 4, -1, 10, 1.5, "1", None,
    ])
    def test_invalid_step_returns_false(self, invalid_step):
        body = {**VALID_BODY, "current_step": invalid_step}
        ok, msg = validate_request(body)
        assert ok is False
        assert msg == "invalid request"


class TestValidateRequestMissingFields:
    """必須フィールド欠如のテスト。"""

    @pytest.mark.parametrize("missing_field", [
        "grade", "current_step", "user_speech", "history",
    ])
    def test_missing_required_field_returns_false(self, missing_field):
        body = {k: v for k, v in VALID_BODY.items() if k != missing_field}
        ok, msg = validate_request(body)
        assert ok is False
        assert msg == "invalid request"

    def test_empty_body_returns_false(self):
        ok, msg = validate_request({})
        assert ok is False
        assert msg == "invalid request"


# ---------------------------------------------------------------------------
# プロパティベーステスト (hypothesis)
# **Validates: Requirements 4.8, 5.10**
# ---------------------------------------------------------------------------

VALID_GRADES = [
    "grade0", "grade1", "grade2", "grade3",
    "grade4", "grade5", "grade6", "grade7",
]
VALID_STEPS = [1, 2, 3]

# grade として取り得る範囲外の値を生成するストラテジー
invalid_grade_strategy = st.one_of(
    st.text().filter(lambda s: s not in VALID_GRADES),
    st.integers(),
    st.none(),
    st.booleans(),
)

# current_step として取り得る範囲外の値を生成するストラテジー
invalid_step_strategy = st.one_of(
    st.integers().filter(lambda n: n not in VALID_STEPS),
    st.text(),
    st.none(),
    st.floats(allow_nan=False),
)

valid_body_strategy = st.fixed_dictionaries({
    "grade": st.sampled_from(VALID_GRADES),
    "current_step": st.sampled_from(VALID_STEPS),
    "user_speech": st.text(min_size=1),
    "history": st.lists(
        st.fixed_dictionaries({
            "role": st.sampled_from(["user", "assistant"]),
            "content": st.text(),
        })
    ),
})


@settings(max_examples=100)
@given(grade=invalid_grade_strategy, step=st.sampled_from(VALID_STEPS))
def test_property_invalid_grade_always_rejected(grade, step):
    """Property 4: 範囲外の grade を含むリクエストは必ず拒否される。

    **Validates: Requirements 4.8, 5.10**
    """
    body = {
        "grade": grade,
        "current_step": step,
        "user_speech": "test",
        "history": [],
    }
    ok, msg = validate_request(body)
    assert ok is False
    assert msg == "invalid request"


@settings(max_examples=100)
@given(grade=st.sampled_from(VALID_GRADES), step=invalid_step_strategy)
def test_property_invalid_step_always_rejected(grade, step):
    """Property 4: 範囲外の current_step を含むリクエストは必ず拒否される。

    **Validates: Requirements 4.8, 5.10**
    """
    body = {
        "grade": grade,
        "current_step": step,
        "user_speech": "test",
        "history": [],
    }
    ok, msg = validate_request(body)
    assert ok is False
    assert msg == "invalid request"


@settings(max_examples=100)
@given(body=valid_body_strategy)
def test_property_valid_request_always_accepted(body):
    """Property 4: 有効なリクエストは必ず受け入れられる。

    **Validates: Requirements 4.8, 5.10**
    """
    ok, msg = validate_request(body)
    assert ok is True
    assert msg == ""
