# WorshiPlay 🎵

Sistema de proyección para alabanza y adoración. Proyecta canciones, biblias, videos y más con transiciones profesionales.

## Características

- **Cancionero** — Carga, edita y proyecta canciones por bloques con estilos visuales (glow, karaoke, neón, etc.)
- **Santa Biblia** — Navegación por libros, capítulos y versículos. Proyección con palabras interactivas y resaltado.
- **Video** — Reproduce videos locales, de YouTube o URL con overlay de letras.
- **Fondos** — Imágenes y videos de fondo con transiciones.
- **PIP (Picture-in-Picture)** — Superpone videos con croma key y control de posición/tamaño.
- **Anuncios y Notas** — Anuncios tipo banner deslizante y notas proyectables en pantalla.
- **Panel de Palabras** — Búsqueda de significados en hebreo, griego, arameo, latín (Strong's, BibleHub, Wiktionary) y exégesis por internet.
- **Configuración** — Tipografía, colores, posición, sombras y más, independiente para texto y referencia.
- **PIP Canvas** — Procesamiento de píxeles para eliminar fondos negros en videos.

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)
- Git (opcional, para clonar)

## Instalación

### Windows, macOS y Linux

```bash
# 1. Clonar o descargar el repositorio
git clone https://github.com/SamuelRM25/worshiplay.git
cd worshipla

# 2. Instalar dependencias
npm install

# 3. Ejecutar
npm start
```

### Windows (alternativa)

Ejecuta `WorshiPlay.bat` o `WorshiPlay_Setup.bat` (instala Node.js automáticamente si no está presente).

### Linux / macOS (alternativa)

```bash
chmod +x WorshiPlay.sh
./WorshiPlay.sh
```

## Compilar para distribución

```bash
# Todas las plataformas
npm run build

# Solo Windows (portable .exe)
npm run build:win

# Solo macOS (.dmg)
npm run build:mac

# Solo Linux (AppImage)
npm run build:linux
```

Los archivos compilados se generan en la carpeta `dist/`.

## Estructura del proyecto

```
worshiplay/
├── main.js              # Proceso principal de Electron
├── preload.js           # Puente entre procesos (IPC)
├── start.js             # Punto de entrada
├── package.json         # Dependencias y scripts
├── src/
│   ├── index.html       # Interfaz de control
│   ├── app.js           # Lógica del panel de control
│   ├── style.css        # Estilos del panel de control
│   ├── projection.html  # Interfaz de proyección
│   ├── projection.js    # Lógica de proyección
│   ├── projection.css   # Estilos de proyección
│   └── modules/         # Módulos auxiliares
├── biblias/             # Archivos de Biblia (.bi, .json)
├── cancioneros/         # Archivos de canciones (.js)
├── fondos/              # Imágenes y videos de fondo
└── settings.json        # Configuración guardada (se crea al ejecutar)
```

## Idiomas de búsqueda bíblica

El panel de palabras soporta búsqueda en:
- **Hebreo** — Caracteres hebreos + números Strong (H####)
- **Griego** — Caracteres griegos + números Strong (G####)
- **Latín** — Búsqueda en Wiktionary
- **Arameo** — Búsqueda general
- **Cualquier idioma** — Diccionario general + DuckDuckGo

## Atajos de teclado

- `Ctrl+Enter` — Proyectar elemento activo
- `Escape` — Pantalla en blanco
- `B` — Pantalla en blanco

## Licencia

MIT
