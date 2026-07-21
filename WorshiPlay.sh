#!/bin/bash
echo "======================================="
echo "   WorshiPlay - Sistema de Proyeccion"
echo "======================================="

cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no está instalado."
    echo "Descárgalo de: https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install --loglevel=error
fi

if [ ! -f "biblias/rv1960.json" ]; then
    echo "Convirtiendo Biblia..."
    node convert-bible.js
fi

echo "Iniciando WorshiPlay..."
npx electron . &
sleep 3
exit 0
