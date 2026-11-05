# POS System

Secure, maintainable POS monorepo foundation. No POS business modules are implemented yet.

## Stack

- Frontend: React, Vite, TypeScript strict mode, Tailwind CSS, React Router, Axios, TanStack Query, React Hook Form, Zod.
- Backend: Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy 2.0, Alembic, PostgreSQL, JWT/Argon2 foundations.
- Quality: Pytest, Ruff, MyPy, ESLint, Prettier, Vitest.

## Prerequisites

Node.js 22+, npm, and Python 3.12+.

## Local setup

1. Backend:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. Frontend:

   ```powershell
   cd frontend
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```

Frontend: http://localhost:5173. API and Swagger UI: http://localhost:8000/docs. Health: http://localhost:8000/api/v1/health.

Database setup and migrations are intentionally deferred.

## Checks

```powershell
cd backend
pytest
ruff check .
mypy app

cd ..\frontend
npm run build
npm run lint
npm run format
npm test
```

## Workflow

Create future domain features under `backend/app/services`, `repositories`, `models`, and `schemas`; expose them through versioned endpoint modules. Add frontend screens under `features` and keep shared infrastructure in `app`, `components`, and `lib`. Never commit `.env` files or real credentials.
