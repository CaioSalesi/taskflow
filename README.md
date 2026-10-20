# TaskFlow

TaskFlow is a full-stack project management platform built with React, TypeScript, and .NET. It features task tracking, team collaboration, and role-based access control, evolving into a scalable architecture with microservices, messaging, automated testing, CI/CD, AWS integration, and observability tools.

## Getting started

Prerequisites:

- [Node.js](https://nodejs.org/) 20 or newer (includes npm) — for the frontend
- [.NET SDK](https://dotnet.microsoft.com/download) 10 — for the API
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — runs the PostgreSQL database

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

### Database

The API stores its data in PostgreSQL, which runs inside a Docker container — you don't need to install PostgreSQL itself. With Docker Desktop open, run from the repo root:

```bash
docker compose up -d
```

That downloads the Postgres image the first time and starts it in the background on port 5433 (5433 instead of the default 5432 to avoid clashing with any PostgreSQL already installed on the machine). Data survives restarts in a Docker volume named `postgres-data`. Useful commands:

```bash
docker compose stop        # stop the database (data is kept)
docker compose up -d       # start it again
docker compose down -v     # stop AND wipe all data (fresh start)

# Open a SQL prompt inside the database (\q to exit)
docker exec -it taskflow-postgres psql -U taskflow -d taskflow
```

Credentials for local development (user `taskflow`, password `taskflow`, database `taskflow`) are set in `docker-compose.yml`, and the API's connection string lives in `TaskFlow.Api/appsettings.Development.json`.

### API

With the database running, from the repo root:

```bash
cd TaskFlow.Api
dotnet run
```

On startup (in development) the API automatically applies EF Core migrations, creating the schema — no manual SQL needed. The API listens on http://localhost:5171 (and https://localhost:7068 with the `https` launch profile). In development, the OpenAPI document is available at `/openapi/v1.json`. Sample requests live in `TaskFlow.Api/TaskFlow.Api.http`.

#### Endpoints

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user. Body: `{ "name", "email", "password" }`. Returns `201` with the created user, `400` on validation errors, `409` if the email is already registered. |

Passwords are hashed with PBKDF2 before storage. Users are persisted to PostgreSQL via EF Core; duplicate emails are prevented by a unique index on the `users` table.

#### Changing the database schema

When a model changes, generate a new migration from the repo root (the `dotnet-ef` tool is pinned in `dotnet-tools.json` — run `dotnet tool restore` once after cloning):

```bash
cd TaskFlow.Api
dotnet dotnet-ef migrations add <MigrationName>
```

It is applied automatically the next time the API starts in development.

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
│       ├── pages/         # Route pages (landing, register, login placeholder) + tests
│       ├── data/          # API clients and data access
│       └── test/          # Test setup
├── TaskFlow.Api/          # ASP.NET Core (.NET 10) backend
│   ├── Controllers/       # API endpoints (auth)
│   ├── Contracts/         # Request/response DTOs
│   ├── Models/            # Domain models
│   ├── Repositories/      # Data access (EF Core + PostgreSQL)
│   ├── Services/          # Password hashing (PBKDF2)
│   ├── Infrastructure/    # Global exception handling
│   ├── Data/              # EF Core DbContext
│   └── Migrations/        # EF Core database migrations
└── docker-compose.yml     # Local infrastructure (PostgreSQL)
```
