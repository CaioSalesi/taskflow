# TaskFlow

TaskFlow is a full-stack project management platform built with React, TypeScript, and .NET. It features task tracking, team collaboration, and role-based access control, evolving into a scalable architecture with microservices, messaging, automated testing, CI/CD, AWS integration, and observability tools.

## Getting started

Prerequisites:

- [Node.js](https://nodejs.org/) 20 or newer (includes npm) — for the frontend
- [.NET SDK](https://dotnet.microsoft.com/download) 10 — for the API

### Frontend

From the repo root:

```bash
# 1. Go into the frontend and install dependencies
cd taskflow-frontend
npm install

# 2. Start the dev server
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173) to see the landing page.

### API

From the repo root:

```bash
cd TaskFlow.Api
dotnet run
```

The API listens on http://localhost:5171 (and https://localhost:7068 with the `https` launch profile). In development, the OpenAPI document is available at `/openapi/v1.json`. Sample requests live in `TaskFlow.Api/TaskFlow.Api.http`.

#### Endpoints

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user. Body: `{ "name", "email", "password" }`. Returns `201` with the created user, `400` on validation errors, `409` if the email is already registered. |

Passwords are hashed with PBKDF2 before storage. Users are persisted to a local JSON file (`TaskFlow.Api/Data/users.json`) for now; a real database comes later.

### Other useful commands

Run these inside `taskflow-frontend/`:

| Command | What it does |
| --- | --- |
| `npm test` | Run the test suite once (Vitest + React Testing Library) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint the codebase with ESLint |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## Project structure

```
taskflow/
├── taskflow-frontend/     # React + TypeScript + Vite frontend
│   └── src/
│       ├── pages/         # Route pages (landing, auth placeholders) + their tests
│       ├── data/          # Data access (mocked for now, real API later)
│       └── test/          # Test setup
└── TaskFlow.Api/          # ASP.NET Core (.NET 10) backend
    ├── Controllers/       # API endpoints (auth)
    ├── Contracts/         # Request/response DTOs
    ├── Models/            # Domain models
    ├── Repositories/      # Data access (JSON file store for now)
    ├── Services/          # Password hashing (PBKDF2)
    ├── Infrastructure/    # Global exception handling
    └── Data/              # Local JSON data files
```
