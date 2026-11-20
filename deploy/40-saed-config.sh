#!/bin/sh
# Writes /config.js from the container environment so the same image can point at any API without a rebuild.
#   API_URL=https://saed-api.example.com/api   (leave empty for same-origin /api proxied by this nginx)
set -e
esc=$(printf '%s' "${API_URL:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf 'window.__SAED_CONFIG__ = { API_URL: "%s" };\n' "$esc" > /usr/share/nginx/html/config.js
