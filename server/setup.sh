#!/bin/bash
# Setup script for GWOFO Admin Server
# Run this script to automatically set up the backend environment

echo "======================================"
echo "GWOFO Admin Dashboard - Setup Script"
echo "======================================"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Navigate to server directory
cd "$(dirname "$0")" || exit 1

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✓ Dependencies installed successfully"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  Please update .env with your database credentials"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update .env with your database URL if needed"
echo "2. Run 'npm run db:setup' to create database tables"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "Server will run on: http://localhost:3000"
echo ""
