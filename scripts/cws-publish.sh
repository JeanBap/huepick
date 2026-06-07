#!/usr/bin/env bash
# HuePick — publish to the Chrome Web Store via the official API (no dashboard).
# Usage:
#   CWS_CLIENT_ID=... CWS_CLIENT_SECRET=... CWS_REFRESH_TOKEN=... \
#   ./cws-publish.sh path/to/huepick.zip [ITEM_ID]
set -euo pipefail
ZIP="${1:?Pass the path to the extension .zip}"
ITEM_ID="${2:-lmjkfmidnmnfibolojhdobdbggleffck}"   # HuePick's item id (from the dashboard URL)
: "${CWS_CLIENT_ID:?Set CWS_CLIENT_ID}"
: "${CWS_CLIENT_SECRET:?Set CWS_CLIENT_SECRET}"
: "${CWS_REFRESH_TOKEN:?Set CWS_REFRESH_TOKEN}"

echo "1/3  Exchanging refresh token for an access token..."
ACCESS_TOKEN=$(curl -s https://oauth2.googleapis.com/token \
  -d client_id="$CWS_CLIENT_ID" \
  -d client_secret="$CWS_CLIENT_SECRET" \
  -d refresh_token="$CWS_REFRESH_TOKEN" \
  -d grant_type=refresh_token \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

echo "2/3  Uploading $ZIP to item $ITEM_ID ..."
curl -s -X PUT -T "$ZIP" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-goog-api-version: 2" \
  "https://www.googleapis.com/upload/chromewebstore/v1.1/items/$ITEM_ID?uploadType=media"
echo

echo "3/3  Submitting for review / publishing..."
curl -s -X POST -H "Content-Length: 0" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-goog-api-version: 2" \
  "https://www.googleapis.com/chromewebstore/v1.1/items/$ITEM_ID/publish"
echo
echo "Done. 'uploadState: SUCCESS' and 'status: [OK]' mean it is in review (1-3 days)."
