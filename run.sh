#!/bin/bash

# Simple Toolbox setup for Bananoid game
echo "🐋 Setting up Toolbox container for Bananoid..."

# Check if toolbox is installed, install if missing
if ! command -v toolbox &> /dev/null; then
    echo "📦 Toolbox not found. Installing..."
    
    # Check the distribution (assuming Fedora-based since your script uses dnf)
    if command -v dnf &> /dev/null; then
        echo "🔧 Installing toolbox via dnf..."
        sudo dnf install -y toolbox
    elif command -v apt &> /dev/null; then
        echo "🔧 Installing toolbox via apt..."
        sudo apt update
        sudo apt install -y toolbox
    else
        echo "❌ Unsupported package manager. Please install toolbox manually."
        echo "   See: https://github.com/containers/toolbox"
        exit 1
    fi
fi

# Define container name
CONTAINER_NAME="bananoid-dev"

# Create container if it doesn't exist
if ! toolbox list | grep -q "$CONTAINER_NAME"; then
    echo "🚀 Creating new Toolbox container: $CONTAINER_NAME"
    toolbox create "$CONTAINER_NAME"
fi

# Install Node.js (for http-server)
echo "🔧 Installing Node.js..."
toolbox run -c "$CONTAINER_NAME" sudo dnf install -y nodejs npm

# Install http-server
echo "🌐 Installing http-server..."
toolbox run -c "$CONTAINER_NAME" sudo npm install -g http-server

# Install latest Go
echo "⚙️ Installing latest Go version..."
toolbox run -c "$CONTAINER_NAME" bash -c 'curl -OL https://golang.org/dl/go1.25.2.linux-amd64.tar.gz'
toolbox run -c "$CONTAINER_NAME" sudo tar -C /usr/local -xzf go1.25.2.linux-amd64.tar.gz
toolbox run -c "$CONTAINER_NAME" rm go1.25.2.linux-amd64.tar.gz

# Add Go to PATH in container's bashrc
echo "🔧 Setting up Go environment..."
toolbox run -c "$CONTAINER_NAME" bash -c 'echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc'
toolbox run -c "$CONTAINER_NAME" bash -c 'echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.bash_profile'

# Verify installations
echo "✅ Verifying installations..."
toolbox run -c "$CONTAINER_NAME" node --version
toolbox run -c "$CONTAINER_NAME" /usr/local/go/bin/go version

echo "🎉 Setup complete!"
echo ""
echo "To use your development environment:"
echo "  toolbox enter $CONTAINER_NAME"
echo ""
echo "Once inside the container:"
echo "  1. Navigate to your project directory"
echo "  2. Run: go run ."
echo ""
echo "Your Go server will serve the game on http://localhost:8080"