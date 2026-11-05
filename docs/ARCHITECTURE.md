# Architecture

The repository is a monorepo with an independently deployable Vite/React frontend and FastAPI backend. The backend is organized by API, core configuration/security, database infrastructure, and future domain layers (models, repositories, services). API routes are versioned under `/api/v1`.

PostgreSQL is the only persistent service. SQLAlchemy owns connection pooling and session lifecycle, while Alembic owns schema migrations. The frontend accesses the backend through a centralized Axios client and TanStack Query provider.

