# Express BFF Module (`server.js`)

## Purpose
The Express layer is the backend-for-frontend gateway for the React app. It handles Bedrock chat directly and proxies agent/data routes to FastAPI.

## Responsibilities
1. Serve `/api/chat` by invoking AWS Bedrock Runtime.
2. Proxy investigation routes (`/api/agent/*`) to FastAPI.
3. Proxy data routes (`/api/alerts`, `/api/cases`, `/api/customers`, etc.) to FastAPI.
4. Proxy write route `POST /api/cases/:caseId/sar` to FastAPI.

## Main Configuration
- `AGENT_API_URL` (default `http://localhost:8000`)
- `PORT` (default `3001`)
- Bedrock credentials/model from `.env`

## Route Groups
- **Direct route:** `POST /api/chat`
- **Agent proxy routes:** `/api/agent/investigate`, `/api/agent/investigate/:alert_id/stream`, `/api/agent/skills`
- **Data proxy prefixes:** alerts, cases, customers, sars, anomalies, screening, network, dashboard, models, connectors, transactions, investigations

## Error Handling Behavior
- Bedrock failures return HTTP 500 with actionable config message.
- Proxy failures return HTTP 502 or 500 and include human-readable unavailability hints.

## Extension Guidelines
- Keep direct routes above catch-all proxy middleware.
- Add new FastAPI-owned endpoint prefixes to `DATA_PROXY_PREFIXES`.
- Preserve pass-through status codes and headers from upstream where possible.
