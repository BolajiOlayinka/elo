# EloStats Admin

Internal dashboard for catalogue stats, signed-up users, point weights, staff, and roles.

The app is mounted at **`/admin/`** (locally and on the dyno).

```bash
cd elo_admin
npm install
npm run dev
```

Open [http://localhost:5174/admin/](http://localhost:5174/admin/). Point settings is `/admin/points`.

A root `npm run build:web` copies this build to `elo_backend/public/admin` so Express can serve `/admin/` and `/admin/points`. `/admin/queues` stays Bull Board.

All figures are demo data until the API is wired.
