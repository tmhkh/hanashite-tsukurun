"""Lambda エントリポイント。

POST /api/create-slide を処理し、Amazon Bedrock（Claude）を呼び出して
スライドコンテンツを生成して返す。

処理フロー:
  1. OPTIONS プリフライトリクエストに HTTP 200 を返す
  2. event["body"] を JSON パースしてリクエストボディを取得
  3. validator.py の validate_request() で検証 → 失敗時 HTTP 400
  4. kanji_filter.py の get_kanji_instruction() でプロンプト指示を取得
  5. script_generator.py の build_script_prompt_suffix() でスクリプト指示を取得
  6. system プロンプトを組み立てる
  7. bedrock_client.py の invoke_claude() で Claude を呼び出す
  8. Bedrock エラー時は HTTP 500
  9. 全レスポンスに CORS ヘッダーを付与
"""

from __future__ import annotations

import json
import os
from typing import Any

from bedrock_client import invoke_claude
from kanji_filter import get_kanji_instruction
from rate_limiter import check_and_increment
from script_generator import build_script_prompt_suffix
from validator import validate_request

# デフォルトモデル ID（環境変数から読み取り、未設定時は Claude 3 Haiku をデフォルトとする）
DEFAULT_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "jp.anthropic.claude-haiku-4-5-20251001-v1:0")

# 全レスポンスに付与する CORS ヘッダー
CORS_HEADERS: dict[str, str] = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}


def _make_response(status_code: int, body: Any) -> dict[str, Any]:
    """共通レスポンス生成ヘルパー。CORS ヘッダーを付与する。"""
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False),
    }


def _build_system_prompt(
    grade: str,
    current_step: int,
) -> str:
    """Bedrock に渡すシステムプロンプトを組み立てる。

    設計書の「Bedrock プロンプト構造」に従い、以下のセクションを含む:
    - 出力フォーマット（JSON）
    - 漢字制限（Kanji_Filter）
    - 現在のステップ指示
    - スクリプト生成指示（Script_Generator）

    Args:
        grade: 学年区分（"grade0"〜"grade7"）。
        current_step: 現在のステップ（1, 2, または 3）。

    Returns:
        システムプロンプト文字列。
    """
    kanji_instruction = get_kanji_instruction(grade)
    script_suffix = build_script_prompt_suffix(current_step)

    # 次のステップ値を決定（サーバー側で確定）
    next_step_value = current_step + 1 if current_step < 3 else 4

    # ステップ別の指示
    step_instructions = {
        1: (
            "子どもが発表テーマを話しました。"
            "slide_titleにテーマを入れてください。"
            "ai_response_voiceで、子どもの発言を受け止めつつ、次のステップ（内容の詳細）で何を話せばよいかを"
            "優しく丁寧に案内してください。例：「いいテーマだね！つぎは、そのテーマについて、どんなことをしたか・見たか・感じたかを教えてね」"
        ),
        2: (
            "子どもがテーマの詳細を話しました。"
            "slide_textに内容をまとめてください。"
            "ai_response_voiceで、子どもの発言をほめつつ、これからまとめに入ることを伝えてください。"
            "例：「すごいね！それはとっても大切なことだね。これまでのことをまとめてはっぴょう台本を作るよ！」"
        ),
        3: (
            "最終ステップです。これまでの会話をまとめて発表台本を作ります。"
            "slide_titleに「まとめ」と入れてください。"
            "scriptフィールドに100文字以上400文字以内の発表台本を書いてください。"
            "ai_response_voiceに完成メッセージを入れてください。"
            "例：「すばらしいはっぴょうができたよ！みんなにじょうずに伝えてね！」"
        ),
    }
    step_instruction = step_instructions.get(current_step, "")

    system_prompt = f"""あなたは小学生に優しく話す先生AIです。

【絶対ルール】next_step の値は {next_step_value} にすること。変更禁止。

【出力】以下のJSON形式のみ出力（説明文は不要）:
{{
  "slide_title": "タイトル",
  "slide_text": "本文",
  "image_keyword": "英単語1語",
  "ai_response_voice": "子どもへの優しい返事（150文字以内）。次に何を話せばよいか具体的に案内する。",
  "next_step": {next_step_value},
  "script": "{'' if current_step != 3 else '台本をここに書く'}"
}}

{kanji_instruction}

{step_instruction}
{script_suffix}"""

    return system_prompt


def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Lambda エントリポイント。

    Args:
        event: API Gateway から渡されるイベントオブジェクト。
        context: Lambda コンテキストオブジェクト（未使用）。

    Returns:
        API Gateway レスポンス形式の辞書。
    """
    # 1. OPTIONS プリフライトリクエストへの対応
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get(
        "http", {}
    ).get("method", "")
    if http_method.upper() == "OPTIONS":
        return _make_response(200, {})

    # 2. リクエストボディの JSON パース
    raw_body = event.get("body") or "{}"
    try:
        body: dict[str, Any] = json.loads(raw_body)
    except (json.JSONDecodeError, ValueError):
        return _make_response(400, {"error": "invalid request"})

    # 3. バリデーション
    is_valid, error_message = validate_request(body)
    if not is_valid:
        return _make_response(400, {"error": error_message})

    # フィールドを取得（バリデーション通過済み）
    grade: str = body["grade"]
    current_step: int = body["current_step"]
    user_speech: str = body["user_speech"]
    history: list[dict[str, Any]] = body["history"]

    # 4 & 5 & 6. システムプロンプトを組み立て
    # （get_kanji_instruction と build_script_prompt_suffix を内部で呼び出す）
    system_prompt = _build_system_prompt(grade, current_step)

    # messages: history + 今回のユーザー発話
    messages: list[dict[str, Any]] = list(history) + [
        {"role": "user", "content": user_speech}
    ]

    # 7. Bedrock 月次呼び出し回数チェック
    try:
        allowed, count = check_and_increment()
        if not allowed:
            return _make_response(429, {
                "error": f"月次 Bedrock 呼び出し上限（{count}回）に達しました。来月まで利用できません。"
            })
    except Exception as exc:
        # レートリミットチェック失敗時は安全側に倒してブロック
        return _make_response(500, {"error": f"Rate limit check failed: {str(exc)}"})

    # 8. Bedrock（Claude）を呼び出す
    model_id = DEFAULT_MODEL_ID
    try:
        slide_response = invoke_claude(
            prompt=system_prompt,
            messages=messages,
            model_id=model_id,
        )
    except Exception as exc:
        # 9. Bedrock エラー時は HTTP 500
        error_detail = str(exc)
        return _make_response(500, {"error": error_detail})

    # 10. next_step をサーバー側で強制上書き（モデルが間違えた場合の安全策）
    expected_next_step = current_step + 1 if current_step < 3 else 4
    slide_response["next_step"] = expected_next_step

    # 11. 成功レスポンス（CORS ヘッダー付き）
    return _make_response(200, slide_response)
