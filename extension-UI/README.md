# Smart Research Assistant Extension UI

A Chrome Extension side panel UI for capturing selected webpage text and sending it to a local research backend for summarization.

## What this repo contains

This repository contains the browser extension frontend only:

- `manifest.json`
- `background.js`
- `content.js`
- `sidepanel.html`
- `sidepanel.css`
- `sidepanel.js`

## How it works

1. Select text on any webpage.
2. Open the extension side panel.
3. The selected text is captured and shown in the panel.
4. Click **Research** to send the text to the local backend.
5. The response can be saved into local history inside the extension.

## Local backend dependency

The extension currently sends requests to:

`http://localhost:8080/api/research/process`

You will need a backend running at that address for the summarize action to work.

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this project folder

## Suggested files to upload to GitHub

Upload the full extension frontend:

- `manifest.json`
- `background.js`
- `content.js`
- `sidepanel.html`
- `sidepanel.css`
- `sidepanel.js`
- `README.md`
- `.gitignore`

## What not to upload

Do not upload:

- `node_modules/`
- build output folders like `dist/`, `build/`, or `out/`
- `.env` files
- editor-specific folders like `.vscode/` or `.idea/`
- private API keys, tokens, or secrets

## Before publishing publicly

- Replace the localhost backend URL if you want others to use the extension without your local server.
- Review requested Chrome permissions and keep only the ones you need.
- Add screenshots and setup steps if you want a stronger GitHub presentation.
