#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v go &>/dev/null; then
    echo "Go is not installed. Install it from https://go.dev/dl/ and re-run."
    exit 1
fi

echo "Serving Bananoid on http://localhost:8080 (Ctrl+C to stop)"
go run .
