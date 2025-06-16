#!/bin/bash

echo "========================================"
echo "Crisp Conversation Exporter Setup"
echo "========================================"
echo

echo "Checking if Node.js is installed..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

echo "Node.js is installed!"
node --version

echo
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo
echo "========================================"
echo "Installation completed successfully!"
echo "========================================"
echo
echo "Starting the server..."
echo "Open your browser and go to: http://localhost:3000"
echo
echo "Press Ctrl+C to stop the server when done."
echo

npm start
