#!/usr/bin/env bash
set -euo pipefail

cd /var/www/claude

npm install --prefix backend --omit=dev
npm install --prefix frontend
npm run build --prefix frontend

pm2 startOrReload deployment/pm2.config.cjs --update-env
pm2 save

sudo nginx -t
sudo systemctl reload nginx

curl -f http://127.0.0.1:5001/api/health
