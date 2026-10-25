# Fasal AI Backend.

API server for the Fasal AI agricultural advisory app.

## Stack

Express + PostgreSQL + Prisma (+ Better Auth)

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Copy env file and set `DATABASE_URL` to your PostgreSQL connection string:

```bash
cp .env.example .env
```

3. Apply migrations and generate Prisma Client:

```bash
npx prisma migrate deploy
npm run build
```

4. Start the API:

```bash
npm run dev
```

API: `http://localhost:5000`

## Deploy on Render

1. Create a Render PostgreSQL database and copy its Internal Database URL into `DATABASE_URL`.
2. Set environment variables from `.env.example` (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, etc.).
   For email verification, use a `RESEND_FROM_EMAIL` address on a domain verified in Resend. Resend's `onboarding@resend.dev` test sender is not for general recipient delivery.
3. Build command: `npm install && npx prisma migrate deploy && npm run build`
4. Start command: `npm start`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api` | Health check |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/signin` | Sign in |
| GET | `/api/auth/me` | Current user (Bearer token) |

### Field records

All field routes require a valid Better Auth session cookie. Frontend requests should send credentials.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/fields` | List the signed-in user's fields |
| POST | `/api/fields` | Create a field |
| PATCH | `/api/fields/:id` | Update one of the signed-in user's fields |
| DELETE | `/api/fields/:id` | Delete one of the signed-in user's fields |

Create a field with `name`, `crop`, and numeric `area`. `areaUnit` accepts `acre` or `hectare`; `location`, `season`, `plantingDate` (`YYYY-MM-DD`), and `notes` are optional.

```json
{
  "name": "North plot",
  "crop": "Wheat",
  "area": 2.5,
  "areaUnit": "acre",
  "location": "Multan",
  "season": "Rabi",
  "plantingDate": "2026-11-01",
  "notes": "Near the canal"
}
```

### Signup body

```json
{
  "firstName": "Ali",
  "lastName": "Khan",
  "email": "ali@example.com",
  "password": "secret123"
}
```
