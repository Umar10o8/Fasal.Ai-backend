# Fasal AI Backend

API server for the Fasal AI agricultural advisory app.

## Folder layout

```
Fasal.Ai/
├── Fasal.Ai/     # frontend (Vite + React)
└── backend/      # this project (Express + MongoDB)
```

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Copy env file (already created for local use):

```bash
cp .env.example .env
```

3. Start MongoDB locally, then run:

```bash
npm run dev
```

API: `http://localhost:5000`

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
