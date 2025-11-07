#!/usr/bin/env bash

IMAGE_NAME='k-oso-radar-radar-app'

# detener inmediatamente si cualquier comando falla
set -e

VERSION=$(node -p "require('./package.json').version")
HTML_FILE="public/index.html"

echo "🔧 Actualizando versión en $HTML_FILE → v$VERSION"

# Detectar sistema operativo
OS="$(uname -s)"

case "$OS" in
    Linux*)
        # GNU sed
        sed -i "s/v[0-9.]\+/v$VERSION/" "$HTML_FILE"
        ;;
    Darwin*)
        # macOS (BSD sed requiere cadena vacía después de -i)
        sed -i '' "s/v[0-9.]\+/v$VERSION/" "$HTML_FILE"
        ;;
    *)
        echo "⚠️ Sistema no soportado: $OS"
        exit 1
        ;;
esac

echo "✅ Versión actualizada"

echo "🐳 Construyendo imagen Docker..."
docker build -t $IMAGE_NAME:$VERSION .

echo "✅ Imagen construida: $IMAGE_NAME:$VERSION"
