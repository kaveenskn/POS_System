# Security foundation

- Secrets are supplied through environment variables and excluded from Git.
- Password hashing uses Argon2 and JWT helpers provide short-lived access and refresh token primitives.
- CORS is allowlisted from configuration; security headers, request size checks, and rate-limit middleware are installed.
- Error responses intentionally avoid stack traces and sensitive values.
- Database access uses SQLAlchemy parameterization.

Authentication flows, authorization policies, token revocation, production secret management, TLS, and comprehensive abuse testing remain future work. This foundation must not be treated as a completed security review.

