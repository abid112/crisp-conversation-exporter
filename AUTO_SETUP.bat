@echo off
title Crisp Conversation Exporter - Auto Setup
color 0A

echo.
echo ========================================
echo   CRISP CONVERSATION EXPORTER
echo   Automatic Setup and Installation
echo ========================================
echo.

echo [1/5] Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js is already installed!
    node --version
    goto :install_deps
)

echo ✗ Node.js is not installed.
echo.
echo [2/5] Would you like me to help you install Node.js?
echo.
echo Option 1: I'll open the download page for you
echo Option 2: Try the standalone HTML version instead
echo Option 3: Exit and install manually
echo.
set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" goto :download_node
if "%choice%"=="2" goto :standalone
if "%choice%"=="3" goto :manual_exit
goto :invalid_choice

:download_node
echo.
echo [3/5] Opening Node.js download page...
echo Please download and install Node.js, then run this script again.
start https://nodejs.org/
echo.
echo After installing Node.js:
echo 1. Restart this script (double-click AUTO_SETUP.bat)
echo 2. Or run: install-and-run.bat
echo.
pause
exit

:standalone
echo.
echo [3/5] Opening standalone HTML version...
echo Note: This version has limitations due to browser security.
echo For full functionality, please install Node.js.
echo.
if exist "standalone.html" (
    start standalone.html
    echo ✓ Standalone version opened in your browser.
) else (
    echo ✗ standalone.html not found in current directory.
)
echo.
pause
exit

:install_deps
echo.
echo [3/5] Installing dependencies...
if not exist "package.json" (
    echo ✗ package.json not found. Are you in the correct directory?
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

npm install
if %errorlevel% neq 0 (
    echo ✗ Failed to install dependencies!
    echo.
    echo Troubleshooting:
    echo 1. Make sure you have internet connection
    echo 2. Try running as administrator
    echo 3. Delete node_modules folder and try again
    echo.
    pause
    exit /b 1
)

echo ✓ Dependencies installed successfully!

echo.
echo [4/5] Starting the server...
echo.
echo ========================================
echo   SERVER STARTING...
echo   Open your browser to: http://localhost:3000
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

timeout /t 2 >nul

echo [5/5] Opening browser...
timeout /t 3 >nul
start http://localhost:3000

npm start

goto :end

:invalid_choice
echo.
echo ✗ Invalid choice. Please enter 1, 2, or 3.
timeout /t 2 >nul
goto :download_node

:manual_exit
echo.
echo Please install Node.js manually from: https://nodejs.org/
echo Then run this script again or use install-and-run.bat
echo.
pause
exit

:end
echo.
echo Server stopped.
pause
