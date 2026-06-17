"""Bedrock_Client モジュール。

Amazon Bedrock（Claude 3.5 Sonnet / Haiku）の invoke_model を呼び出し、
SlideResponse 型の辞書を返す。
"""

from __future__ import annotations

import json
import re
from typing import Any, List

import boto3

from lambda_types import SlideResponse


def _extract_json(text: str) -> Any:
    """テキストからJSONオブジェクトを抽出する。

    Claude がコードブロック (```json ... ```) で囲んで返す場合や、
    前後に説明文が付いている場合に対応する。

    Args:
        text: Claude のレスポンステキスト。

    Returns:
        パース済みの JSON オブジェクト。

    Raises:
        json.JSONDecodeError: JSON の抽出・パースに失敗した場合。
    """
    # まず直接パースを試みる
    stripped = text.strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    # コードブロック内のJSONを抽出
    code_block_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", stripped, re.DOTALL)
    if code_block_match:
        return json.loads(code_block_match.group(1).strip())

    # { ... } のブロックを抽出
    brace_match = re.search(r"\{.*\}", stripped, re.DOTALL)
    if brace_match:
        return json.loads(brace_match.group(0))

    raise json.JSONDecodeError("No valid JSON found in response", text, 0)


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
                  （例: "jp.anthropic.claude-haiku-4-5-20251001-v1:0"）。

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
    slide_response: SlideResponse = _extract_json(raw_text)

    return slide_response
