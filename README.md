# PawReach

PawReach is a centralized animal-rescue emergency response platform built for a hackathon. It bridges the gap between everyday citizens and verified animal rescue organizations. Anyone can instantly view local rescuers or submit an SOS report, which triggers targeted email alerts. Rescue teams can register, log into their secure portal, and manage active emergencies from "Unassigned" to "Resolved."

## What it does

- **Public Portal**: Lists verified animal rescue organizations filtered by city.
- **Incident Reporting**: Frictionless SOS reporting form for urgent situations.
- **Automated Dispatch**: Sends immediate, localized HTML email alerts to rescue organizations using the Resend API.
- **Rescuer Portal**: A secure dashboard for organizations to claim and track incidents (using JWT authentication).
- **Dual-Database Architecture**: PostgreSQL handles structured, relational data (Orgs and Auth), while MongoDB handles flexible, document-based incident lifecycles.

## Repository structure

```text
.
|- app-frontend/       # Next.js 16 + React 19 web application (Tailwind CSS)
|- app-backend/        # Express API, Postgres + MongoDB connections, Resend integration
`- README.md
```

## Prerequisites

- Node.js 20.9 or later
- npm
- PostgreSQL database (local or cloud)
- MongoDB database (local or cloud)
- Resend API key (for email dispatch)

## Run locally

Install dependencies from the repository root:

```bash
cd app-backend && npm install
cd ../app-frontend && npm install
```

### Environment variables

**`app-backend/.env`**
```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_URL=postgres://user:password@localhost:5432/pawreach
MONGO_URI=mongodb://localhost:27017/pawreach
JWT_SECRET=super_secret_jwt_key
RESEND_API_KEY=re_your_resend_key
```

**`app-frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
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

Open [http://localhost:3000](http://localhost:3000). The API runs on [http://localhost:4000](http://localhost:4000) by default.

## Testing

The project includes robust unit testing using **Jest**, **Supertest**, and **React Testing Library**.

To run backend tests (Mocked DBs & Resend):
```bash
cd app-backend
npm test
```

To run frontend tests (Mocked APIs):
```bash
cd app-frontend
npm test
```

## Core API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new organization. |
| `POST` | `/api/auth/login` | Authenticate and return JWT token. |
| `GET` | `/api/organizations?city=Delhi` | Public list of organizations by city. |
| `POST` | `/api/incidents` | Create an incident and email local orgs. |
| `GET` | `/api/incidents/unassigned` | (Auth) Get unassigned local incidents. |
| `PUT` | `/api/incidents/:id/assign` | (Auth) Claim an incident. |
| `PUT` | `/api/incidents/:id/status` | (Auth) Update incident status (e.g. resolved). |

## Production & Scaling

The architecture is built for serverless deployment:
- **Frontend**: Optimized for Vercel deployment (Next.js).
- **Backend**: Can run as an Express server or exported as a Vercel Serverless Function (`module.exports = app;`).