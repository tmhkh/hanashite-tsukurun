"""bedrock_client モジュールのユニットテスト。"""

from __future__ import annotations

import json
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest

from bedrock_client import invoke_claude


# ---------------------------------------------------------------------------
# 共通フィクスチャ
# ---------------------------------------------------------------------------

VALID_SLIDE_RESPONSE = {
    "slide_title": "すきなどうぶつ",
    "slide_text": "ぼくはいぬがすきです",
    "image_keyword": "dog",
    "ai_response_voice": "いいね！どんなところがすきなの？",
    "next_step": 2,
    "script": "",
}

MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"

SYSTEM_PROMPT = "あなたは優しい女性の先生AIキャラクターです。"

MESSAGES = [{"role": "user", "content": "いぬについて話したい"}]


def _make_mock_response(content_text: str) -> MagicMock:
    """Bedrock invoke_model の戻り値を模倣する MagicMock を返す。"""
    body_bytes = json.dumps(
        {"content": [{"text": content_text}]}, ensure_ascii=False
    ).encode()
    mock_response = MagicMock()
    mock_response["body"].read.return_value = body_bytes
    return mock_response


# ---------------------------------------------------------------------------
# 正常系
# ---------------------------------------------------------------------------


def test_invoke_claude_returns_slide_response():
    """正常なレスポンスを受け取ったとき SlideResponse 型の辞書を返す。"""
    content_text = json.dumps(VALID_SLIDE_RESPONSE, ensure_ascii=False)

    with patch("bedrock_client.boto3.client") as mock_boto3_client:
        mock_client = MagicMock()
        mock_boto3_client.return_value = mock_client
        mock_client.invoke_model.return_value = _make_mock_response(content_text)

        result = invoke_claude(SYSTEM_PROMPT, MESSAGES, MODEL_ID)

    assert result["slide_title"] == "すきなどうぶつ"
    assert result["slide_text"] == "ぼくはいぬがすきです"
    assert result["image_keyword"] == "dog"
    assert result["ai_response_voice"] == "いいね！どんなところがすきなの？"
    assert result["next_step"] == 2
    assert result["script"] == ""


def test_invoke_claude_passes_correct_request_body():
    """invoke_model に正しいリクエストボディ（anthropic Messages API 形式）が渡される。"""
    content_text = json.dumps(VALID_SLIDE_RESPONSE, ensure_ascii=False)

    with patch("bedrock_client.boto3.client") as mock_boto3_client:
        mock_client = MagicMock()
        mock_boto3_client.return_value = mock_client
        mock_client.invoke_model.return_value = _make_mock_response(content_text)

        invoke_claude(SYSTEM_PROMPT, MESSAGES, MODEL_ID)

        call_kwargs = mock_client.invoke_model.call_args[1]

    assert call_kwargs["modelId"] == MODEL_ID
    assert call_kwargs["contentType"] == "application/json"
    assert call_kwargs["accept"] == "application/json"

    sent_body = json.loads(call_kwargs["body"])
    assert sent_body["anthropic_version"] == "bedrock-2023-05-31"
    assert sent_body["system"] == SYSTEM_PROMPT
    assert sent_body["messages"] == MESSAGES
    assert sent_body["max_tokens"] == 1024


def test_invoke_claude_uses_bedrock_runtime_client():
    """bedrock-runtime クライアントが生成される。"""
    content_text = json.dumps(VALID_SLIDE_RESPONSE, ensure_ascii=False)

    with patch("bedrock_client.boto3.client") as mock_boto3_client:
        mock_client = MagicMock()
        mock_boto3_client.return_value = mock_client
        mock_client.invoke_model.return_value = _make_mock_response(content_text)

        invoke_claude(SYSTEM_PROMPT, MESSAGES, MODEL_ID)

    mock_boto3_client.assert_called_once_with("bedrock-runtime")


def test_invoke_claude_with_step3_script():
    """step=3 のレスポンスで script フィールドが非空文字列として返る。"""
    slide_response_step3 = {**VALID_SLIDE_RESPONSE, "next_step": 4, "script": "わたしはいぬがすきです。"}
    content_text = json.dumps(slide_response_step3, ensure_ascii=False)

    with patch("bedrock_client.boto3.client") as mock_boto3_client:
        mock_client = MagicMock()
        mock_boto3_client.return_value = mock_client
        mock_client.invoke_model.return_value = _make_mock_response(content_text)

        result = invoke_claude(SYSTEM_PROMPT, MESSAGES, MODEL_ID)

    assert result["next_step"] == 4
    assert result["script"] == "わたしはいぬがすきです。"


# ---------------------------------------------------------------------------
# 異常系
# ---------------------------------------------------------------------------


def test_invoke_claude_raises_on_invalid_outer_json():
    """Bedrock レスポンスボディ自体が不正な JSON のとき JSONDecodeError が raise される。"""
    with patch("bedrock_client.boto3.client") as mock_boto3_client:
        mock_client = MagicMock()
        mock_boto3_client.return_value = mock_client

        invalid_body = MagicMock()
        invalid_body["body"].read.return_value = b"NOT_JSON"
        mock_client.invoke_model.return_value = invalid_body

        with pytest.raises(json.JSONDecodeError):
            invoke_claude(SYSTEM_PROMPT, MESSAGES, MODEL_ID)


def test_invoke_claude_raises_on_invalid_inner_json():
    """content[0].text が不正な JSON のとき JSONDecodeError が raise される。"""
    invalid_inner_body = json.dumps(
        {"content": [{"text": "NOT_VALID_JSON"}]}
    ).encode()

    with patch("bedrock_client.boto3.client") as mock_boto3_client:
        mock_client = MagicMock()
        mock_boto3_client.return_value = mock_client

        mock_resp = MagicMock()
        mock_resp["body"].read.return_value = invalid_inner_body
        mock_client.invoke_model.return_value = mock_resp

        with pytest.raises(json.JSONDecodeError):
            invoke_claude(SYSTEM_PROMPT, MESSAGES, MODEL_ID)


def test_invoke_claude_raises_on_bedrock_error():
    """Bedrock クライアントが例外を raise したとき、そのまま伝播する。"""
    with patch("bedrock_client.boto3.client") as mock_boto3_client:
        mock_client = MagicMock()
        mock_boto3_client.return_value = mock_client
        mock_client.invoke_model.side_effect = RuntimeError("Bedrock unavailable")

        with pytest.raises(RuntimeError, match="Bedrock unavailable"):
            invoke_claude(SYSTEM_PROMPT, MESSAGES, MODEL_ID)
