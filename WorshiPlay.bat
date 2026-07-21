@echo off
title WorshiPlay - Sistema de Proyeccion
cd /d "%~dp0"

echo =======================================
echo    WorshiPlay - Sistema de Proyeccion
echo =======================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Descargalo de: https://nodejs.org/
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules\electron\dist\electron.exe" (
    echo Instalando dependencias...
    call npm install --loglevel=error
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion.
        pause
        exit /b 1
    )
)

:: Convert Bible if needed
if not exist "biblias\rv1960.json" (
    echo Convirtiendo Biblia...
    node convert-bible.js
)

echo Iniciando WorshiPlay...
start "" /B "node_modules\.bin\electron.cmd" .
echo.
echo La aplicacion se esta iniciando...
echo Si no se abre, verifica que no haya errores en la consola.
timeout /t 3 /nobreak >nul
exit
