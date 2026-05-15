#!/usr/bin/env bash
set -euo pipefail

src=".github/hooks/pre-commit"
dst=".git/hooks/pre-commit"

cp "$src" "$dst"
chmod +x "$dst"
