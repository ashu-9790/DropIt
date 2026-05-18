# DropItt Backend

Node.js backend for DropItt - Express + MongoDB + Google Gemini AI

## Deployment on Render

### Prerequisites
- MongoDB Atlas account (or other MongoDB hosting)
- Google Gemini API key

### Environment Variables Required
- `NODE_ENV=production`
- `MONGO_URI` - Your MongoDB connection string
- `MONGO_DB=dropit`
- `GEMINI_API_KEY` - Your Google Gemini API key
- `GEMINI_MODEL=gemini-flash-latest`
- `CORS_ORIGINS=https://dropitt.me,https://www.dropitt.me`

### Deploy Steps
1. Go to https://render.com/
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** drop-it-backend
   - **Root Directory:** backend/node
   - **Environment:** Node
   - **Build Command:** npm install
   - **Start Command:** node src/app.js
6. Add environment variables
7. Click "Create Web Service"

### Custom Domain
After deployment, add custom domain `api.dropitt.me` in Render dashboard.

## Local Development

```bash
cd backend/node
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/generate` - Generate message (body: { vibe, recipient, language, tone })
- `GET /api/message/:share_id` - Get message
- `POST /api/message/:share_id/share` - Record share
- `GET /api/stats` - Get stats

## Notes

- If Gemini fails or is not configured, the service returns a deterministic fallback message
- Fallback messages are recorded with `generation.source: "fallback"` and `generation.model: "template"`
