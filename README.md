# Companion_Core
Deterministic execution core for an offline-first AI companion. Defines routing, security boundaries, execution contracts, and strict LLM orchestration with hard budgets, fallbacks, and auditability.

## Local Development

### Environment
Copy the example env file and update as needed (only required for isolated frontend dev):

```sh
copy apps\\web\\.env.local.example apps\\web\\.env.local
```

Default value:
```
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3002
```

### Install
```sh
pnpm install
```

### How to Run (Dev)
Single-command dev (same origin on `http://localhost:3000`):
```sh
pnpm dev
```
Runs:
- UI: http://localhost:3000
- Gateway: http://localhost:3002

### Independent Development
Run the gateway only:
```sh
pnpm --filter gateway dev
```

Run the frontend only (default Next port 3000):
```sh
pnpm --filter web dev
```

If you run the frontend alone and want it to call a separate gateway, set:
```
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3002
```

### Weather API (Open-Meteo)
The gateway exposes:
```
GET /api/weather?lat=...&lon=...
GET /api/weather?query=City+Name
```
No API key required. The UI routes weather-style questions to this endpoint.

### Time API (WorldTimeAPI)
The gateway exposes:
```
GET /api/time?timezone=Area/City
GET /api/time?query=City+Name
```
No API key required. The UI routes time-style questions to this endpoint.

### Natural Language System (NLS)
Responses are composed by deterministic templates with small, repeatable variation
based on the request hash. No LLMs are used.

### End-to-End Check
1. Open `http://localhost:3000/dashboard`.
2. Confirm the dashboard cards populate with structured JSON from the gateway.
3. Visit `/dashboard/backlog`, `/dashboard/risk`, `/dashboard/audit`, `/dashboard/document`.

### SCA Demo (Mock Data)
The demo endpoints return structured JSON (no free text):
- `POST /api/analyze-document`
- `POST /api/scan-backlog`
- `POST /api/risk-flag`
- `GET /api/audit-log?page=1&limit=10`
- `POST /api/meeting-summary`

Example (PowerShell):
```powershell
Invoke-RestMethod http://localhost:3002/api/analyze-document -Method Post -Body (@{ title='Memo'; text='Policy sign-off by 18 Mar 2026.' } | ConvertTo-Json) -ContentType 'application/json'
```
