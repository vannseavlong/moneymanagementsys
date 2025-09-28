@echo off
echo 🚀 Setting up MMMS Development Environment...

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Create environment files if they don't exist
echo ⚙️ Setting up environment files...

if not exist "apps\backend\.env" (
  copy "apps\backend\.env.example" "apps\backend\.env"
  echo ✅ Backend .env created from template
) else (
  echo ✅ Backend .env already exists
)

REM Start development servers
echo 🔄 Starting development servers...
echo Frontend will be available at: http://localhost:5173
echo Backend will be available at: http://localhost:3001
echo.
echo ⚠️  Remember to:
echo    1. Set up Google OAuth2 credentials in apps\backend\.env
echo    2. Set up Telegram Bot token (optional)
echo    3. Enable Google Sheets API and Google Drive API
echo.

call npm run dev