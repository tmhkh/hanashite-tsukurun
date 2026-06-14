"""Bedrock_Client モジュール。

Amazon Bedrock（Claude 3.5 Sonnet / Haiku）の invoke_model を呼び出し、
SlideResponse 型の辞書を返す。
"""

from __future__ import annotations

import json
from typing import Any, List

import boto3

from lambda_types import SlideResponse


def invoke_claude(
    prompt: str,
    messages: List[dict[str, Any]],
    model_id: str,
) -> SlideResponse:
    """Claude モデルを呼び出してスライドレスポンスを返す。

    Args:
        prompt: システムプロンプト（漢字制限やステップ指示などを含む）。
        messages: Anthropic Messages API 形式のメッセージリスト。
                  [{"role": "user" | "assistant", "content": "..."}] の形式。
        model_id: 呼び出す Bedrock モデル ID
                  （例: "anthropic.claude-3-5-sonnet-20241022-v2:0"）。

    Returns:
        SlideResponse 型の辞書。Bedrock から返った content[0].text を
        JSON パースして生成する。

    Raises:
        json.JSONDecodeError: Bedrock レスポンスのパースに失敗した場合。
        Exception: Bedrock の呼び出し自体が失敗した場合。
    """
    client = boto3.client("bedrock-runtime")

    request_body: dict[str, Any] = {
        "anthropic_version": "bedrock-2023-05-31",
        "system": prompt,
        "messages": messages,
        "max_tokens": 1024,
    }

    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(request_body, ensure_ascii=False),
    )

    # レスポンスボディを読み取り JSON パース
    response_body_raw: bytes = response["body"].read()
    response_body: dict[str, Any] = json.loads(response_body_raw)

    # content[0].text を取得してさらに JSON パース → SlideResponse
    raw_text: str = response_body["content"][0]["text"]
    slide_response: SlideResponse = json.loads(raw_text)

    return slide_response
