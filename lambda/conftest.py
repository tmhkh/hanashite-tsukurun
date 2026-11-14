"""pytest 設定: lambda/ ディレクトリをインポートパスに追加し、
標準 types モジュールのシャドウを回避する。
"""

import os
import sys

# lambda/ ディレクトリを sys.path に追加する前に
# Python 標準 types モジュールを先にロードしておく。
# これにより lambda/types.py によるシャドウを防ぐ。
import types  # noqa: F401 — 標準 types を sys.modules に確保する

# lambda/ ディレクトリ自体をパスに追加（既に追加済みでない場合のみ）
_lambda_dir = os.path.dirname(os.path.abspath(__file__))
if _lambda_dir not in sys.path:
    sys.path.insert(0, _lambda_dir)

import pytest

_AWS_ENV_TO_CLEAR = (
    "AWS_PROFILE",
    "AWS_DEFAULT_PROFILE",
    "AWS_SESSION_TOKEN",
    "AWS_SECURITY_TOKEN",
    "AWS_CONFIG_FILE",
    "AWS_SHARED_CREDENTIALS_FILE",
)


@pytest.fixture(autouse=True)
def _isolate_aws_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    """テストが手元の AWS 認証情報（SSO 等）を使って実環境へ接続しないようにする。

    ダミーの認証情報を設定するため、モック漏れがあっても実リソースには届かず、
    認証エラーとしてすぐに失敗する。
    """
    for key in _AWS_ENV_TO_CLEAR:
        monkeypatch.delenv(key, raising=False)
    nonexistent = os.path.join(_lambda_dir, ".nonexistent-aws-config")
    monkeypatch.setenv("AWS_CONFIG_FILE", nonexistent)
    monkeypatch.setenv("AWS_SHARED_CREDENTIALS_FILE", nonexistent)
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ap-northeast-1")
