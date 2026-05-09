# Roast or Toast — Node.js backend

Quick scaffold providing the same API as the previous Flask backend.

Setup

1. Copy `.env.example` -> `.env` and fill `GEMINI_API_KEY` and `MONGO_URI`.
2. Install dependencies:

```bash
cd backend/node
npm install
```

3. Start:

```bash
npm start
# or for development with automatic reload
npm run dev
```

API

- `GET /api/health` — health check
- `POST /api/generate` — body: { vibe, recipient, language, tone }
- `GET /api/message/:share_id` — retrieve saved message

Notes

- The Gemini HTTP endpoint is configurable via `GEMINI_ENDPOINT`.
- If Gemini fails or is not configured, the service returns a deterministic fallback message and records `generation.source: "fallback"` and `generation.model: "template"`.
