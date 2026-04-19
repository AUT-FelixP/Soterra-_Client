# Soterra Monorepo

This workspace is split into three standalone projects so you can deploy them independently and publish them to separate GitHub repositories:

- `frontend/`
  Next.js UI and API proxy routes. Deploy this as the Vercel frontend project.
- `backend/`
  FastAPI service for report extraction, analytics, and persistence. Deploy this as the Vercel backend project.
- `database/`
  Supabase schema and migrations. Apply this to your Supabase project.

## Deployment shape

1. Push `frontend/` to a frontend GitHub repo and connect it to a Vercel project.
2. Push `backend/` to a backend GitHub repo and connect it to a separate Vercel project.
3. Apply `database/supabase/migrations` to Supabase, then use those credentials in the backend project.

The frontend already talks to the backend through `BACKEND_BASE_URL`, so the main deployment task is wiring the environment variables correctly.
