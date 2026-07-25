# Fasal AI Backend

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
3. Build command: `npm install && npx prisma migrate deploy && npm run build`
4. Start command: `npm start`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api` | Health check |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/signin` | Sign in |
| GET | `/api/auth/me` | Current user (Bearer token) |

### Signup body

```json
{
  "firstName": "Ali",
  "lastName": "Khan",
  "email": "ali@example.com",
  "password": "secret123"
}
```
