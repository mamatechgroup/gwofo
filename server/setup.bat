@echo off
REM Setup script for GWOFO Admin Server (Windows)
REM Run this script to automatically set up the backend environment

echo.
echo ======================================
echo GWOFO Admin Dashboard - Setup Script
echo ======================================
echo.

REM Check Node.js installation
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js 14+ first.
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

REM Navigate to server directory
cd /d "%~dp0"

REM Install dependencies
echo Installing npm dependencies...
call npm install

if errorlevel 1 (
    echo Error: npm install failed
    exit /b 1
)

echo Dependencies installed successfully
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo .env file created
    echo WARNING: Please update .env with your database credentials
) else (
    echo .env file already exists
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Update .env with your database URL if needed
echo 2. Run 'npm run db:setup' to create database tables
echo 3. Run 'npm run dev' to start the development server
echo.
echo Server will run on: http://localhost:3000
echo.
pause
