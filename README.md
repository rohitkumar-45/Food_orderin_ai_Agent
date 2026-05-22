# Food Ordering AI Agent

Voice-first food ordering app with a React frontend, Express backend, cart workflow, checkout simulation, and Swiggy/Zomato provider adapters.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/rohitkumar-45/Food_orderin_ai_Agent)

## Important API Note

Swiggy and Zomato do not provide open public consumer ordering APIs for arbitrary apps. This project uses mock provider adapters by default and keeps the integration boundary in `backend/src/providers`. To place real orders, replace the mock providers with approved partner APIs, OAuth flows, webhooks, and payment handling from the platforms.

## Features

- Voice commands through the browser Web Speech API
- Typed command fallback
- Search across Swiggy and Zomato provider adapters
- Restaurant selection, menu browsing, cart updates, checkout
- Responsive interactive UI
- Production Node service that serves both API and React build
- Render and Railway deployment files

## Commands

```bash
npm install
npm run dev
npm run build
npm start
```

Local URLs:

- Frontend dev server: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Health check: `http://localhost:8080/api/health`

Example commands:

- `search biryani on Swiggy`
- `add two masala dosa`
- `choose Pizza Yard`
- `checkout`
- `remove Veg Thali`

## Directory

```text
food-ordering-ai-agent/
  backend/
    src/agent/        command parsing and order workflow
    src/providers/    Swiggy/Zomato adapter boundary
    src/data/         mock restaurant/menu data
    src/server.ts     Express API and production static host
  frontend/
    src/App.tsx       interactive UI
    src/useVoice.ts   browser speech recognition hook
  render.yaml
  railway.json
  Procfile
```

## Deploy To Render

1. Push this directory to a GitHub repository.
2. In Render, create a new Blueprint or Web Service from the repo.
3. Use:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Health check path: `/api/health`
4. Set environment variables:
   - `NODE_ENV=production`
   - `PROVIDER_MODE=mock`
   - `FRONTEND_ORIGIN=*`

## Deploy To Railway

1. Push this directory to a GitHub repository.
2. In Railway, create a project from the repo.
3. Railway will read `railway.json`.
4. Set environment variables:
   - `NODE_ENV=production`
   - `PROVIDER_MODE=mock`
   - `FRONTEND_ORIGIN=*`

## Real Provider Integration Workflow

1. Create real provider classes implementing `FoodProvider`.
2. Add official API credentials to environment variables.
3. Replace `providers` in `backend/src/providers/index.ts` based on `PROVIDER_MODE`.
4. Add platform-specific checkout, payment, cancellation, and order tracking endpoints.
5. Add compliance checks for user consent, platform terms, payments, and data retention.
