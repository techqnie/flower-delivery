#!/bin/bash

echo "🌸 FLOWER DELIVERY PROJECT SETUP"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check if Node.js is installed
print_step "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Step 2: Create directory structure
print_step "Creating project structure..."
mkdir -p public database

# Step 3: Move files to correct locations
print_step "Organizing files..."

# Move frontend files to public/
if [ -f "index.html" ]; then
    mv index.html public/
    print_success "Moved index.html to public/"
fi

if [ -f "product.html" ]; then
    mv product.html public/
    print_success "Moved product.html to public/"
fi

if [ -f "order.html" ]; then
    mv order.html public/
    print_success "Moved order.html to public/"
fi

if [ -f "styles.css" ]; then
    mv styles.css public/
    print_success "Moved styles.css to public/"
fi

if [ -f "order.css" ]; then
    mv order.css public/
    print_success "Moved order.css to public/"
fi

if [ -f "product.css" ]; then
    mv product.css public/
    print_success "Moved product.css to public/"
fi

if [ -f "main.js" ]; then
    mv main.js public/
    print_success "Moved main.js to public/"
fi

if [ -f "order.js" ]; then
    mv order.js public/
    print_success "Moved order.js to public/"
fi

if [ -f "product.js" ]; then
    mv product.js public/
    print_success "Moved product.js to public/"
fi

if [ -f "api.js" ] && [ ! -f "public/api.js" ]; then
    cp api.js public/
    print_success "Copied api.js to public/"
fi

# Move database files
if [ -f "mongodb_schema.json" ]; then
    mv mongodb_schema.json database/
    print_success "Moved MongoDB schema to database/"
fi

if [ -f "mongodb_complete_setup.js" ]; then
    mv mongodb_complete_setup.js database/
    print_success "Moved MongoDB setup to database/"
fi

if [ -f "mongodb_test_data.js" ]; then
    mv mongodb_test_data.js database/
    print_success "Moved MongoDB test data to database/"
fi

if [ -f "shops.json" ]; then
    mv shops.json database/
    print_success "Moved shops.json to database/"
fi

if [ -f "products.json" ]; then
    mv products.json database/
    print_success "Moved products.json to database/"
fi

if [ -f "orders.json" ]; then
    mv orders.json database/
    print_success "Moved orders.json to database/"
fi

if [ -f "import_instructions.txt" ]; then
    mv import_instructions.txt database/
    print_success "Moved import instructions to database/"
fi

# Step 4: Install dependencies
print_step "Installing Node.js dependencies..."
if npm install; then
    print_success "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies!"
    exit 1
fi

# Step 5: Check MongoDB connection
print_step "Testing MongoDB connection..."
print_warning "Make sure your MongoDB Atlas cluster is accessible"
print_warning "Check database/import_instructions.txt for data import"

# Step 6: Display final instructions
echo ""
echo "🎉 PROJECT SETUP COMPLETE!"
echo "=========================="
echo ""
echo "📁 Project Structure:"
echo "   ├── server.js (Backend server)"
echo "   ├── package.json (Dependencies)"  
echo "   ├── .env (Configuration)"
echo "   ├── database/ (MongoDB files)"
echo "   └── public/ (Frontend files)"
echo ""
echo "🚀 To start the server:"
echo "   npm run dev    (Development mode with auto-reload)"
echo "   npm start      (Production mode)"
echo ""
echo "🌐 Server will run on:"
echo "   Frontend: http://localhost:5000"
echo "   API: http://localhost:5000/api"
echo "   Health: http://localhost:5000/api/health"
echo ""
echo "📊 Database Import:"
echo "   1. Import database files from database/ folder"
echo "   2. Use MongoDB Compass or mongoimport command"
echo "   3. See database/import_instructions.txt"
echo ""
echo "💡 Next Steps:"
echo "   1. Import data to MongoDB Atlas"
echo "   2. Run: npm run dev"
echo "   3. Open http://localhost:5000"
echo "   4. Test all functionality"
echo ""
print_success "Ready to launch! 🌸"
