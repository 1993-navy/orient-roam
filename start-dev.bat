@echo off
echo Starting Orient Roam development server...
echo You can access the site at: http://orient-roam.com:3000
echo You can also access it at: http://localhost:3000

cd /d D:\orient-roam
set DATABASE_URL=file:./dev.db
set AUTH_SECRET=dev-only-secret-change-me-in-production-0123456789
set NEXT_PUBLIC_AMAP_KEY=299d7331c4e521dc44f5c5e9e0768d75
set NEXT_PUBLIC_AMAP_SECURITY_CODE=69abfb75dc60ba43658286b726ede012

npm run dev -- --port 3000