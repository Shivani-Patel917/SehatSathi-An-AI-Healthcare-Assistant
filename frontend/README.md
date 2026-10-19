# Sehat Sathi Frontend

React + Vite + Tailwind + React Router + Axios + Recharts.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. In dev mode the login page shows
"Demo user" / "Demo admin" buttons so you can explore without a backend.

## Structure

- `src/routes` route table and guards
- `src/layouts` General, User and Admin shells
- `src/pages` public pages
- `src/user` logged-in user features (mounted at `/app/*`)
- `src/admin` admin features (mounted at `/admin/*`)
- `src/api` Axios instance and per-resource API helpers
- `src/context` auth state
