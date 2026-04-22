# Soterra Client

This repository contains the Soterra client application.

- `frontend/`
  Next.js UI and API proxy routes.

## Deployment

Push this repository to GitHub and connect the `frontend/` directory to Vercel.

The backend service and database migrations are managed outside this client repository. The frontend talks to the hosted backend through `BACKEND_BASE_URL`.
