# PawReach

PawReach is an animal-rescue discovery and incident-reporting app built for a hackathon. It helps people find verified rescue organizations in their city and quickly alert nearby responders when an animal needs help.

## What it does

- Lists animal rescue organizations by city.
- Lets people search local rescue teams and call them directly.
- Provides an accessible incident-report form for urgent situations.
- Sends a submitted incident to the backend, which queues notifications for organizations in the same city.

The root route (`/`) redirects to `/animal-rescue`.

## Repository structure

```text
.
|- app-frontend/       # Next.js 16 + React 19 web application
|- app-backend/        # Express API and notification queue prototype
`- README.md
```

## Prerequisites

- Node.js 20.9 or later
- npm

## Run locally

Install dependencies from the repository root:

```bash
npm --prefix app-backend ci
npm --prefix app-frontend ci
```

Start the API in one terminal:

```bash
cd app-backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd app-frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the animal-rescue experience. The API runs on [http://localhost:4000](http://localhost:4000) by default.

## Environment variables

The defaults work for local development. Set these variables when your frontend and backend are deployed separately:

| App | Variable | Default | Purpose |
| --- | --- | --- | --- |
| Frontend | `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Base URL of the Express API. |
| Backend | `PORT` | `4000` | Port used by the Express server. |
| Backend | `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed frontend origin for CORS. |

For example, create `app-frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.example.com
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check. |
| `GET` | `/api/organizations?city=Delhi` | Return rescue organizations, optionally filtered by city. |
| `POST` | `/api/incidents` | Create an incident and queue local organization notifications. |
| `GET` | `/api/incidents/:id/notifications` | View notification records for an incident. |

Example incident request:

```bash
curl -X POST http://localhost:4000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Delhi",
    "situation": "Injured or unwell",
    "location": "India Gate",
    "details": "Dog appears to have an injured leg."
  }'
```

## Production direction

The current backend uses in-memory seed data and an in-memory notification queue to keep the hackathon prototype simple. For AWS deployment, replace those pieces with:

- A persistent store for organizations and incidents, such as DynamoDB or RDS.
- SNS, SES, or EventBridge for asynchronous notifications and retries.
- Authentication and authorization for NGO responders and incident management.
- Observability, rate limiting, validation, and location-aware responder matching.