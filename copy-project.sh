#!/bin/bash

echo "📦 Copying project to GitHub-ready folder..."
echo "============================================"

SOURCE_DIR="/home/neno/opencode/1stproject"
DEST_DIR="/home/neno/opencode/1stproject-github-ready"

# Create directory structure
mkdir -p "$DEST_DIR"/{frontend,backend,services,data,docs}

# Copy frontend
echo "Copying frontend..."
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.vite' \
    "$SOURCE_DIR/frontend/" "$DEST_DIR/frontend/"

# Copy backend
echo "Copying backend..."
rsync -av --exclude='__pycache__' --exclude='*.pyc' --exclude='venv' \
    "$SOURCE_DIR/backend/" "$DEST_DIR/backend/"

# Copy services
echo "Copying services..."
for service in misinfo portfolio resilience ai-safety; do
    if [ -d "$SOURCE_DIR/services/$service" ]; then
        echo "  - $service"
        rsync -av --exclude='node_modules' \
            "$SOURCE_DIR/services/$service/" "$DEST_DIR/services/$service/"
    fi
done

# Copy environment examples (but not actual .env files)
echo "Creating environment examples..."
if [ -f "$SOURCE_DIR/backend/.env.example" ]; then
    cp "$SOURCE_DIR/backend/.env.example" "$DEST_DIR/backend/.env.example"
fi

# Create empty data directory (databases not copied for security)
echo "Creating data directory..."
mkdir -p "$DEST_DIR/data"
touch "$DEST_DIR/data/.gitkeep"

# Make scripts executable
chmod +x "$DEST_DIR"/*.sh

echo ""
echo "✅ Project copied successfully!"
echo ""
echo "Next steps:"
echo "1. cd $DEST_DIR"
echo "2. Review and update README.md if needed"
echo "3. Initialize git: git init"
echo "4. Add remote: git remote add origin <your-repo-url>"
echo "5. Commit: git add . && git commit -m 'Initial commit'"
echo "6. Push: git push -u origin main"
