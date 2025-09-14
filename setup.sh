#!/bin/bash
# Setup script for project structure

echo "🏗️  Setting up project structure..."

# Create public directory for frontend files
mkdir -p public

# Move frontend files to public directory
echo "📁 Moving frontend files..."
mv index.html public/
mv product.html public/
mv order.html public/
mv styles.css public/
mv order.css public/
mv product.css public/
mv main.js public/
mv order.js public/
mv product.js public/

# Update api.js and move to public
mv api.js public/

echo "✅ Project structure ready!"
echo "🚀 To start the server:"
echo "   npm install"
echo "   npm start"
