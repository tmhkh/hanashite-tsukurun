"""handler.py のユニットテスト。

Lambda エントリポイントの処理フロー（OPTIONS・バリデーション・
Bedrock 呼び出し・CORS ヘッダー・エラー処理）を検証する。

**Validates: Requirements 4.1, 4.3, 4.5, 4.6, 4.7, 4.8**
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from handler import lambda_handler

# ---------------------------------------------------------------------------
# 共通フィクスチャ
# ---------------------------------------------------------------------------

VALID_BODY = {
    "grade": "grade1",
    "current_step": 1,
    "user_speech": "いぬがすきです",
    "history": [],
}

MOCK_SLIDE_RESPONSE = {
    "slide_title": "すきなどうぶつ",
    "slide_text": "いぬがすきです",
    "image_keyword": "dog",
    "ai_response_voice": "どんなところがすきなの？",
    "next_step": 2,
    "marp_markdown": "",
    "presentation_guide": [],
}


def _make_event(body: dict | None = None, method: str = "POST") -> dict:
    """API Gateway イベント形式のダミーを生成する。"""
    return {
        "httpMethod": method,
        "body": json.dumps(body) if body is not None else None,
    }


# ---------------------------------------------------------------------------
# OPTIONS プリフライトリクエスト（要件 4.5）
# ---------------------------------------------------------------------------

class TestOptionsPreflightRequest:
    """OPTIONS メソッドへの応答テスト。"""

    def test_options_returns_200(self):
        event = _make_event(method="OPTIONS")
        response = lambda_handler(event, None)
        assert response["statusCode"] == 200

    def test_options_includes_cors_headers(self):
        event = _make_event(method="OPTIONS")
        response = lambda_handler(event, None)
        assert "Access-Control-Allow-Origin" in response["headers"]
        assert response["headers"]["Access-Control-Allow-Origin"] == "*"

    def test_options_does_not_call_bedrock(self):
        """OPTIONS リクエスト時は Bedrock を呼び出さない。"""
        event = _make_event(method="OPTIONS")
        with patch("handler.invoke_claude") as mock_invoke:
            lambda_handler(event, None)
            mock_invoke.assert_not_called()


# ---------------------------------------------------------------------------
# リクエストボディ JSON パースエラー（要件 4.8）
# ---------------------------------------------------------------------------

class TestInvalidJsonBody:
    """不正な JSON ボディのテスト。"""

    def test_invalid_json_returns_400(self):
        event = {"httpMethod": "POST", "body": "not-json"}
        response = lambda_handler(event, None)
        assert response["statusCode"] == 400

    def test_none_body_is_handled(self):
        """body が None のとき JSON パースエラーではなく空オブジェクトとして処理される。"""
        event = {"httpMethod": "POST", "body": None}
        response = lambda_handler(event, None)
        # 必須フィールド欠如で 400 になるはず
        assert response["statusCode"] == 400


# ---------------------------------------------------------------------------
# バリデーション失敗（要件 4.8）
# ---------------------------------------------------------------------------

class TestValidationFailure:
    """バリデーション失敗時のテスト。"""

    def test_missing_field_returns_400(self):
        body = {k: v for k, v in VALID_BODY.items() if k != "grade"}
        event = _make_event(body)
        response = lambda_handler(event, None)
        assert response["statusCode"] == 400

    def test_invalid_grade_returns_400(self):
        body = {**VALID_BODY, "grade": "grade9"}
        event = _make_event(body)
        response = lambda_handler(event, None)
        assert response["statusCode"] == 400

    def test_invalid_step_returns_400(self):
        body = {**VALID_BODY, "current_step": 5}
        event = _make_event(body)
        response = lambda_handler(event, None)
        assert response["statusCode"] == 400

    def test_validation_failure_error_body(self):
        body = {**VALID_BODY, "grade": "invalid"}
        event = _make_event(body)
        response = lambda_handler(event, None)
        resp_body = json.loads(response["body"])
        assert resp_body["error"] == "invalid request"

    def test_validation_failure_does_not_call_bedrock(self):
        """バリデーション失敗時は Bedrock を呼び出さない（Property 4）。"""
        body = {**VALID_BODY, "grade": "grade9"}
        event = _make_event(body)
        with patch("handler.invoke_claude") as mock_invoke:
            lambda_handler(event, None)
            mock_invoke.assert_not_called()


# ---------------------------------------------------------------------------
# 正常系（要件 4.3, 4.5）
# ---------------------------------------------------------------------------

class TestSuccessfulRequest:
    """正常なリクエスト処理のテスト。"""

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_valid_request_returns_200(self, mock_invoke):
        event = _make_event(VALID_BODY)
        response = lambda_handler(event, None)
        assert response["statusCode"] == 200

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_valid_request_calls_bedrock(self, mock_invoke):
        event = _make_event(VALID_BODY)
        lambda_handler(event, None)
        mock_invoke.assert_called_once()

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_response_body_contains_slide_fields(self, mock_invoke):
        event = _make_event(VALID_BODY)
        response = lambda_handler(event, None)
        body = json.loads(response["body"])
        assert "slide_title" in body
        assert "slide_text" in body
        assert "image_keyword" in body
        assert "ai_response_voice" in body
        assert "next_step" in body
        assert "script" in body or "marp_markdown" in body

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_bedrock_called_with_correct_model_id(self, mock_invoke):
        """デフォルトモデル ID（環境変数未設定時は Claude 3 Haiku）が使用される。"""
        event = _make_event(VALID_BODY)
        lambda_handler(event, None)
        call_kwargs = mock_invoke.call_args
        assert call_kwargs.kwargs.get("model_id") == "anthropic.claude-3-haiku-20240307-v1:0" or \
               call_kwargs.args[2] == "anthropic.claude-3-haiku-20240307-v1:0"

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_messages_include_history_and_user_speech(self, mock_invoke):
        """messages に history + user_speech が含まれる。"""
        history = [{"role": "assistant", "content": "いっしょにつくろう！"}]
        body = {**VALID_BODY, "history": history}
        event = _make_event(body)
        lambda_handler(event, None)
        call_kwargs = mock_invoke.call_args
        messages = call_kwargs.kwargs.get("messages") or call_kwargs.args[1]
        assert len(messages) == 2
        assert messages[0]["role"] == "assistant"
        assert messages[-1]["role"] == "user"
        assert messages[-1]["content"] == VALID_BODY["user_speech"]


# ---------------------------------------------------------------------------
# CORS ヘッダー（要件 4.5）
# ---------------------------------------------------------------------------

class TestCorsHeaders:
    """すべてのレスポンスに CORS ヘッダーが含まれることを検証。"""

    def test_400_response_has_cors_header(self):
        body = {**VALID_BODY, "grade": "invalid"}
        event = _make_event(body)
        response = lambda_handler(event, None)
        assert response["headers"]["Access-Control-Allow-Origin"] == "*"

    @patch("handler.invoke_claude", side_effect=Exception("Bedrock error"))
    def test_500_response_has_cors_header(self, mock_invoke):
        event = _make_event(VALID_BODY)
        response = lambda_handler(event, None)
        assert response["headers"]["Access-Control-Allow-Origin"] == "*"

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_200_response_has_cors_header(self, mock_invoke):
        event = _make_event(VALID_BODY)
        response = lambda_handler(event, None)
        assert response["headers"]["Access-Control-Allow-Origin"] == "*"


# ---------------------------------------------------------------------------
# Bedrock エラー時 HTTP 500（要件 4.6）
# ---------------------------------------------------------------------------

class TestBedrockError:
    """Bedrock 呼び出しエラー時のテスト。"""

    @patch("handler.invoke_claude", side_effect=Exception("Bedrock connection failed"))
    def test_bedrock_error_returns_500(self, mock_invoke):
        event = _make_event(VALID_BODY)
        response = lambda_handler(event, None)
        assert response["statusCode"] == 500

    @patch("handler.invoke_claude", side_effect=Exception("Some error"))
    def test_bedrock_error_body_has_error_field(self, mock_invoke):
        event = _make_event(VALID_BODY)
        response = lambda_handler(event, None)
        resp_body = json.loads(response["body"])
        assert "error" in resp_body


# ---------------------------------------------------------------------------
# システムプロンプト構造（要件 4.3, 5.x）
# ---------------------------------------------------------------------------

class TestSystemPromptStructure:
    """システムプロンプトに必要な要素が含まれることを検証。"""

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_prompt_contains_kanji_instruction(self, mock_invoke):
        """システムプロンプトに漢字制限指示が含まれる。"""
        event = _make_event(VALID_BODY)  # grade1
        lambda_handler(event, None)
        call_kwargs = mock_invoke.call_args
        prompt = call_kwargs.kwargs.get("prompt") or call_kwargs.args[0]
        # grade1 の漢字制限指示が含まれること
        assert "1年生" in prompt or "80字" in prompt

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_prompt_contains_step_info(self, mock_invoke):
        """システムプロンプトにステップ情報が含まれる。"""
        event = _make_event(VALID_BODY)  # current_step=1
        lambda_handler(event, None)
        call_kwargs = mock_invoke.call_args
        prompt = call_kwargs.kwargs.get("prompt") or call_kwargs.args[0]
        assert "step 1" in prompt

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_prompt_step3_contains_script_instruction(self, mock_invoke):
        """step=3 のプロンプトに Marp/presentation_guide 生成指示が含まれる。"""
        body = {**VALID_BODY, "current_step": 3}
        event = _make_event(body)
        lambda_handler(event, None)
        call_kwargs = mock_invoke.call_args
        prompt = call_kwargs.kwargs.get("prompt") or call_kwargs.args[0]
        assert "marp_markdown" in prompt or "Marp" in prompt

    @patch("handler.invoke_claude", return_value=MOCK_SLIDE_RESPONSE)
    def test_prompt_step1_contains_empty_script_instruction(self, mock_invoke):
        """step=1 のプロンプトに marp_markdown 空文字指示が含まれる。"""
        event = _make_event(VALID_BODY)  # current_step=1
        lambda_handler(event, None)
        call_kwargs = mock_invoke.call_args
        prompt = call_kwargs.kwargs.get("prompt") or call_kwargs.args[0]
        # marp_markdown を空文字にする指示が含まれること
        assert '""' in prompt or "空文字" in prompt


# ---------------------------------------------------------------------------
# HTTP メソッドのハンドリング（API Gateway v1 / v2 両対応）
# ---------------------------------------------------------------------------

class TestHttpMethodHandling:
    """API Gateway v1 / v2 の httpMethod 対応テスト。"""

    def test_options_via_http_method_field(self):
        """httpMethod フィールド経由の OPTIONS。"""
        event = {"httpMethod": "OPTIONS", "body": None}
        response = lambda_handler(event, None)
        assert response["statusCode"] == 200

    def test_options_via_request_context(self):
        """requestContext.http.method 経由の OPTIONS（API Gateway v2）。"""
        event = {
            "requestContext": {"http": {"method": "OPTIONS"}},
            "body": None,
        }
        response = lambda_handler(event, None)
        assert response["statusCode"] == 200
