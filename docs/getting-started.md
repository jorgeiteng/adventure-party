# Getting Started

## Prerequisites

- A modern browser with ES module support (Chrome, Firefox, Safari, Edge)
- Python 3 (for the built-in dev server) **or** any static HTTP server

No `npm install`, no build step, no transpilation — the game runs directly from source.

## Running Locally

The game uses ES modules, so it **must** be served over HTTP (not opened as `file://`).

### Option A: Python Server (Cross-Platform)

```bash
cd adventure-party
python serve.py
```

This starts an HTTP server on port 8080. Open [http://localhost:8080](http://localhost:8080).

To use a different port:

```bash
python serve.py 3000
```

### Option B: PowerShell Server (Windows)

```powershell
.\serve.ps1
```

### Option C: Any HTTP Server

```bash
# Node.js (if installed)
npx http-server -p 8080

# PHP
php -S localhost:8080

# Ruby
ruby -run -e httpd . -p 8080
```

### Option D: Python Built-In

```bash
python -m http.server 8080
```

## Browser Requirements

The game requires:
- ES module support (`<script type="module">`)
- Canvas 2D API
- Web Audio API (for sound)

All modern browsers support these. No WebGL required.

## First Load

1. Start the server
2. Open `http://localhost:8080` in your browser
3. Click or press any key to dismiss the welcome screen
4. Use WASD or arrow keys to move, Space/click to attack

## Troubleshooting

| Problem | Solution |
|---|---|
| Blank page / module errors | Make sure you're serving over HTTP, not `file://` |
| Port 8080 already in use | Use a different port: `python serve.py 3000` |
| No sound | Click the screen or press any key first (browser audio policy) |
| Game feels slow | Close other tabs; the game targets 60fps via `requestAnimationFrame` |
