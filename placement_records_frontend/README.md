# Connecto (Beta) — Placement Records Frontend

Modern, minimalistic React UI for chatting with the placement records assistant.

## Features
- Chat UI with user/bot message bubbles
- Input validation, loading indicator, and error states
- Responsive design for desktop and mobile
- Branding with colors:
  - Primary: `#1a73e8`
  - Secondary: `#e8f0fe`
  - Accent: `#fbbc04`
- Connected to FastAPI backend endpoints (`/` health, `/chat`)

## Getting Started
In the project directory:
- `npm start` — runs the app in development mode at http://localhost:3000
- `npm test` — runs tests
- `npm run build` — production build

## Backend Connectivity
By default, the frontend will attempt to reach the backend at the same host on port `3001` (e.g., https://<your-host>:3001).
You can override this behavior:
- Create `.env` (see `.env.example`) and set:
  - `REACT_APP_BACKEND_URL=/api` (if a reverse proxy maps `/api` -> backend), or
  - `REACT_APP_BACKEND_URL=https://your-backend-host:3001` (absolute origin)
Note: Do not commit secrets. The build environment will inject variables.

## Notes
- This UI uses no heavy UI frameworks; styling is in `src/App.css`.
- Fallback indicator is shown for out-of-context answers marked by the backend.
