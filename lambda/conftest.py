"""pytest 設定: lambda/ ディレクトリをインポートパスに追加し、
標準 types モジュールのシャドウを回避する。
"""

import sys
import os

# lambda/ ディレクトリを sys.path に追加する前に
# Python 標準 types モジュールを先にロードしておく。
# これにより lambda/types.py によるシャドウを防ぐ。
import types  # noqa: F401 — 標準 types を sys.modules に確保する

# lambda/ ディレクトリ自体をパスに追加（既に追加済みでない場合のみ）
_lambda_dir = os.path.dirname(os.path.abspath(__file__))
if _lambda_dir not in sys.path:
    sys.path.insert(0, _lambda_dir)
