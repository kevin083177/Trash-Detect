#!/bin/bash

echo "Checking Git LFS..."
if ! command -v git-lfs &> /dev/null; then
    echo "Git LFS not found, installing..."
    git lfs install
else
    echo "Git LFS is already installed."
fi

echo "Pulling Git LFS files..."
git lfs pull

echo "Setting up environment..."

ROOT_ENV_FILE=".env"
CLOUD_NAME=""
CURRENT_IP=""

if [ -f "$ROOT_ENV_FILE" ]; then
    echo "Reading CLOUD_NAME from $ROOT_ENV_FILE..."
    CLOUD_NAME=$(grep "^CLOUD_NAME=" "$ROOT_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    CURRENT_IP=$(grep "^CURRENT_IP=" "$ROOT_ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")

    if [ -z "$CLOUD_NAME" ]; then
         echo "Warning: CLOUD_NAME key found but value is empty in $ROOT_ENV_FILE"
    fi

    if [ -z "$CURRENT_IP" ]; then
         echo "Warning: CURRENT_IP key found but value is empty in $ROOT_ENV_FILE"
    fi
else
    echo "Warning: Root .env file ($ROOT_ENV_FILE) not found. Cannot configure CLOUD_NAME."
fi

FRONTEND_DIR="./Frontend"
ENV_EXAMPLE="$FRONTEND_DIR/.env.example"
ENV_FILE="$FRONTEND_DIR/.env"

if [ -d "$FRONTEND_DIR" ]; then
    echo "Configuring Frontend environment variables..."
    
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            echo "Created .env from .env.example"
        else
            echo "Error: $ENV_EXAMPLE not found."
            exit 1
        fi
    fi

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/EXPO_PUBLIC_API_URL = \".*\"/EXPO_PUBLIC_API_URL = \"$LOCAL_IP\"/" "$ENV_FILE"
    else
        sed -i "s/EXPO_PUBLIC_API_URL = \".*\"/EXPO_PUBLIC_API_URL = \"$LOCAL_IP\"/" "$ENV_FILE"
    fi
    echo "Updated EXPO_PUBLIC_API_URL to $LOCAL_IP in Frontend/.env"

    if [ -n "$CLOUD_NAME" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/EXPO_PUBLIC_CLOUD_NAME = \".*\"/EXPO_PUBLIC_CLOUD_NAME = \"$CLOUD_NAME\"/" "$ENV_FILE"
        else
            sed -i "s/EXPO_PUBLIC_CLOUD_NAME = \".*\"/EXPO_PUBLIC_CLOUD_NAME = \"$CLOUD_NAME\"/" "$ENV_FILE"
        fi
    fi

    if [ -n "$CURRENT_IP" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/EXPO_PUBLIC_API_URL = \".*\"/EXPO_PUBLIC_API_URL = \"$CURRENT_IP\"/" "$ENV_FILE"
        else
            sed -i "s/EXPO_PUBLIC_API_URL = \".*\"/EXPO_PUBLIC_API_URL = \"$CURRENT_IP\"/" "$ENV_FILE"
        fi
    fi

else
    echo "Error: Frontend directory not found."
    exit 1
fi

echo "Starting Docker Compose..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "Failed to start Docker Compose. Please check the error messages."
    exit 1
fi

echo "Entering Frontend directory and running Yarn..."
cd "$FRONTEND_DIR" || exit

echo "Running yarn install..."
yarn install

echo "Running yarn android..."
yarn android