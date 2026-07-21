@echo off
title WorshiPlay - Setup
echo ============================================
echo   WorshiPlay - Instalacion y Configuracion
echo ============================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js encontrado: 
node -v

:: Install dependencies
echo.
echo Instalando dependencias...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la instalacion de dependencias.
    pause
    exit /b 1
)

echo [OK] Dependencias instaladas exitosamente.

:: Convert Bible
echo.
echo Convirtiendo Biblia a formato JSON...
cd /d "%~dp0"
node -e "
const { convertBiToJson } = require('./src/modules/bible-parser');
const fs = require('fs');
const path = require('path');
try {
    const biPath = path.join(__dirname, 'biblias', 'Reina Valera 1960 - RV1960.bi');
    const bible = convertBiToJson(biPath);
    fs.writeFileSync(path.join(__dirname, 'biblias', 'rv1960.json'), JSON.stringify(bible, null, 2), 'utf-8');
    console.log('[OK] Biblia convertida exitosamente');
} catch(e) {
    console.log('[WARN] No se pudo convertir la Biblia:', e.message);
}
"

echo.
echo ============================================
echo   Instalacion completada!
echo   Ejecute WorshiPlay.bat para iniciar
echo ============================================
pause
