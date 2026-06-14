"""pytest 設定ファイル。

lambda ディレクトリを sys.path に追加し、lambda モジュールをインポート可能にする。
"""

import sys
import os

# lambda ディレクトリを sys.path に追加
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
