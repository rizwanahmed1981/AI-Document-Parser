#!/bin/bash

# Start the document parser backend server

echo "Starting Document Parser Backend..."

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the project
echo "Building project..."
npm run build

# Start the server
echo "Starting server..."
npm start