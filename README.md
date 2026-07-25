# Expediente de Clase

App web para subir la transcripción (.txt) de una clase, generar una guía de
estudio con Claude (basada en neuroaprendizaje) y descargarla como PDF.

## Estructura
- `server/` — backend Express que llama a la API de Anthropic (oculta la API key).
- `client/` — frontend React (Vite) con carga de archivo y generación de PDF (jsPDF).

## Instalación

```bash
npm run install:all
```

## Configuración

Copia el archivo de ejemplo y coloca tu API key de Anthropic:

```bash
cp server/.env.example server/.env
# edita server/.env y pon tu ANTHROPIC_API_KEY
```

## Correr en desarrollo

En dos terminales:

```bash
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

Abre http://localhost:5173, sube el .txt de la clase y descarga el PDF.

## Notas
- La API key nunca se expone al navegador: solo vive en `server/.env`.
- El backend usa el modelo `claude-sonnet-4-6` con el prompt de neuroaprendizaje
  incluido en `server/systemPrompt.js` — puedes editarlo ahí.
- El PDF se genera en el navegador con `jsPDF`, a partir del Markdown que
  regresa Claude.
