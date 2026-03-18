#!/bin/bash

# Download the latest Supabase CLI for Linux x86_64
SUPABASE_URL="https://github.com/supabase/cli/releases/latest/download/supabase-linux-amd64"
INSTALL_DIR="$HOME/bin"

mkdir -p "$INSTALL_DIR"

curl -sL "$SUPABASE_URL" -o "$INSTALL_DIR/supabase"
chmod +x "$INSTALL_DIR/supabase"

# Add $HOME/bin to PATH if not already present
if ! grep -q "$HOME/bin" ~/.bashrc; then
  echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
fi

if ! grep -q "$HOME/bin" ~/.zshrc; then
  echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
fi

echo "Supabase CLI installed to $INSTALL_DIR/supabase"
echo "Run 'source ~/.bashrc' or 'source ~/.zshrc' to update your PATH."
echo "Verify with: supabase --version"
