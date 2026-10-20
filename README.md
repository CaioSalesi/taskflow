# TaskFlow

TaskFlow is a full-stack project management platform built with React, TypeScript, and .NET. It features task tracking, team collaboration, and role-based access control, evolving into a scalable architecture with microservices, messaging, automated testing, CI/CD, AWS integration, and observability tools.

## Getting started

Prerequisite: [Node.js](https://nodejs.org/) 20 or newer (includes npm).

From the repo root:

```bash
# 1. Go into the frontend and install dependencies
cd taskflow-frontend
npm install

# 2. Start the dev server
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173) to see the landing page.

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
└── taskflow-frontend/   # React + TypeScript + Vite frontend
    └── src/
        ├── pages/       # Route pages (landing, auth placeholders) + their tests
        ├── data/        # Data access (mocked for now, real API later)
        └── test/        # Test setup
```
