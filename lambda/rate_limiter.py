"""月次 Bedrock 呼び出し回数制限モジュール。

SSM Parameter Store を使って月次の呼び出し回数をカウントし、
上限（BEDROCK_MONTHLY_LIMIT 環境変数、デフォルト500）を超えた場合にエラーを返す。

パラメータ名: /hanashite-tsukurun/bedrock-invoke-count-YYYY-MM
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

# 月次呼び出し上限（環境変数から読み取り、デフォルト500）
MONTHLY_LIMIT = int(os.environ.get("BEDROCK_MONTHLY_LIMIT", "500"))

# パラメータ名のプレフィックス
PARAM_PREFIX = os.environ.get("RATE_LIMIT_PARAM_PREFIX", "/hanashite-tsukurun/bedrock-invoke-count")

_ssm_client = None


def _get_ssm_client():
    global _ssm_client
    if _ssm_client is None:
        _ssm_client = boto3.client("ssm")
    return _ssm_client


def _get_param_name() -> str:
    """現在の月に対応するパラメータ名を生成する。"""
    now = datetime.now(timezone.utc)
    return f"{PARAM_PREFIX}-{now.strftime('%Y-%m')}"


def check_and_increment() -> tuple[bool, int]:
    """呼び出し回数を確認し、上限内ならインクリメントする。

    Returns:
        (allowed, current_count) のタプル。
        allowed=True なら呼び出し許可。False なら上限超過。
    """
    ssm = _get_ssm_client()
    param_name = _get_param_name()

    # 現在のカウントを取得
    try:
        response = ssm.get_parameter(Name=param_name)
        current_count = int(response["Parameter"]["Value"])
    except ClientError as e:
        if e.response["Error"]["Code"] == "ParameterNotFound":
            current_count = 0
        else:
            raise

    # 上限チェック
    if current_count >= MONTHLY_LIMIT:
        return False, current_count

    # カウントをインクリメント
    new_count = current_count + 1
    ssm.put_parameter(
        Name=param_name,
        Value=str(new_count),
        Type="String",
        Overwrite=True,
    )

    return True, new_count
