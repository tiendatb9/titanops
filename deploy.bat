
@echo off
echo ===========================================
echo TitanOPS Deployment Script
echo ===========================================

echo [1/5] Initializing Git...
git init

echo [2/5] Adding files (Environment Variables in .env are ignored)...
git add .

echo [3/5] Committing changes...
git commit -m "Deploy to Vercel: Complete Shop API and Database Schema"

echo [4/5] Renaming branch to main...
git branch -M main

echo [5/5] Pushing to GitHub...
git remote add origin https://github.com/tiendatb9/titanops.git
git push -u origin main

echo.
echo ===========================================
echo DONE! Code pushed to GitHub.
echo Now go to Vercel and Import Project.
echo ===========================================
pause
