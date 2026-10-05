# Attendance API

Node.js + MongoDB API for geofenced check-in and an admin dashboard.

## Environment

Copy `.env.example` to `.env` and set at minimum:

- `MONGODB_URI` — MongoDB connection string
- `ADMIN_JWT_SECRET` — secret for session tokens
- `ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_PASSWORD` — optional; creates the **first** admin in MongoDB when none exist (on startup or via `npm run seed:admin`)

Admin passwords are stored hashed in MongoDB (`admins` collection). Login is validated against the database, not `.env`.
- `ATTENDANCE_LAT` / `ATTENDANCE_LNG` — geofence center

## Run

```bash
npm run dev
```

## Public API

- `GET /api/config`
- `GET /api/users/:externalId`
- `POST /api/check-in` — one record per user per calendar day (timezone via `ATTENDANCE_TIMEZONE`)

## Admin API

- `POST /api/admin/login` — `{ username, password }` → `{ token }`
- `GET /api/admin/users?from=YYYY-MM-DD&to=YYYY-MM-DD` — users with `attendanceCount` in range (omit dates for all time)
- `GET /api/admin/users/:userId?from=&to=` — profile + attendance days in range

Send `Authorization: Bearer <token>` on admin routes after login.

## QR code

Point users to `https://your-domain.com/check-in`. Admin UI: `/admin`.
# geo-attendance-backend
