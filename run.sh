#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node &>/dev/null; then
    echo "Node.js is not installed. Install it from https://nodejs.org/ and re-run."
    exit 1
fi

echo "Serving Bananoid on http://localhost:8080 (Ctrl+C to stop)"
npm start
