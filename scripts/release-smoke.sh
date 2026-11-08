#!/usr/bin/env bash
set -euo pipefail

base_url="${1:?Usage: release-smoke.sh https://erp.example.org}"
base_url="${base_url%/}"
[[ "$base_url" =~ ^https?://[^[:space:]]+$ ]] || { echo "Invalid smoke-test URL" >&2; exit 1; }

curl --fail --silent --show-error --max-time 20 "$base_url/api/health/ready" |
  python3 -c 'import json,sys; assert json.load(sys.stdin).get("ready") is True'
curl --fail --silent --show-error --max-time 20 "$base_url/login" |
  python3 -c 'import sys; assert "<div id=\"root\"" in sys.stdin.read()'
status=$(curl --silent --show-error --max-time 20 -o /dev/null -w '%{http_code}' \
  -H 'Accept: application/json' "$base_url/api/v1/auth/me")
[ "$status" = 401 ] || { echo "Expected an unauthenticated 401, received $status" >&2; exit 1; }
echo "HTTP readiness, login page and authentication guard verified."
