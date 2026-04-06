# Finance Dashboard Backend API

[![CI](https://github.com/chaitanya-maddala-236/Finance-Dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/chaitanya-maddala-236/Finance-Dashboard/actions/workflows/ci.yml)

> A production-ready REST API for managing personal and organizational financial records with role-based access control, JWT authentication, soft-delete auditing, and interactive Swagger documentation. Built with **Fastify v5**, **Prisma ORM**, and **PostgreSQL**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Docker Setup](#docker-setup)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
- [Error Response Contract](#error-response-contract)
- [Role & Permission Matrix](#role--permission-matrix)
- [Query Parameters](#query-parameters)
- [Sample API Calls](#sample-api-calls)
- [Running Tests](#running-tests)
- [Project Architecture](#project-architecture)
- [Technical Decisions](#technical-decisions)
- [Assumptions](#assumptions)

---

## Features

- ✅ **JWT Authentication** — stateless, role-embedded tokens
- ✅ **Refresh Token Rotation** — 30-day tokens with automatic revocation on deactivation
- ✅ **Role-based Access Control** — VIEWER / ANALYST / ADMIN
- ✅ **Financial Records CRUD** — with soft delete for audit history
- ✅ **Dashboard Analytics** — summary totals and monthly income vs expense breakdowns
- ✅ **Fastify Schema Validation** — all inputs validated at route level with JSON Schema
- ✅ **Consistent Error Shape** — every error returns `{ success: false, message }`; never exposes Fastify internals
- ✅ **Rate Limiting** — global 100 req/min via `@fastify/rate-limit`
- ✅ **Swagger / OpenAPI Docs** — auto-generated at `/docs`
- ✅ **Prisma ORM** — type-safe queries, migrations, and seed data
- ✅ **Integration Tests** — 27 tests across Auth, Records, and Dashboard modules

---

## Tech Stack

| Technology        | Purpose                     | Version   |
|-------------------|-----------------------------|-----------|
| Node.js           | Runtime                     | >= 20.0.0 |
| Fastify           | Web Framework               | v5        |
| Prisma            | ORM + Migrations            | v5        |
| PostgreSQL        | Relational Database         | >= 14     |
| jsonwebtoken      | JWT Signing & Verification  | —         |
| bcryptjs          | Password Hashing            | —         |
| @fastify/jwt      | Fastify JWT Plugin          | —         |
| @fastify/rate-limit | Rate Limiting             | —         |
| @fastify/swagger  | OpenAPI Spec Generation     | —         |
| @scalar/fastify-api-reference | Swagger UI      | —         |
| Jest + Supertest  | Integration Testing         | —         |

---

## Docker Setup

### Run with Docker (Recommended)

```bash
# Copy env file
cp finance-backend/.env.example finance-backend/.env

# Edit .env with your JWT_SECRET

# Start everything (Postgres + API + seed)
cd finance-backend
docker-compose up --build

# API available at http://localhost:3000
# Docs available at http://localhost:3000/docs
```

### Stop

```bash
docker-compose down

# Remove volumes (wipes database)
docker-compose down -v
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0 (required by Fastify v5 dependencies)
- **PostgreSQL** >= 14 (local or cloud — e.g. Neon, Supabase, Railway)
- **npm** >= 9

### 1. Clone the Repository

```bash
git clone https://github.com/chaitanya-maddala-236/Finance-Dashboard.git
cd Finance-Dashboard/finance-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables) below).

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed Sample Data

```bash
npm run prisma:seed
```

This creates 3 users (Admin, Analyst, Viewer) and 5 sample financial records.

### 6. Start the Server

```bash
# Development (with hot reload via nodemon)
npm run dev

# Production
npm start
```

### 7. Verify

```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }

curl http://localhost:3000
# → { "success": true, "message": "Finance Dashboard API is running 🚀", ... }
```

---

## Environment Variables

| Variable        | Required | Description                               | Example                                          |
|-----------------|----------|-------------------------------------------|--------------------------------------------------|
| `DATABASE_URL`  | ✅       | PostgreSQL connection string              | `postgresql://user:pass@localhost:5432/finance`  |
| `JWT_SECRET`    | ✅       | Secret key for JWT signing (min 32 chars) | `a-very-long-random-secret-key`                  |
| `JWT_EXPIRES_IN`| ❌       | Token expiry duration (default: `7d`)     | `7d`, `24h`, `3600`                              |
| `PORT`          | ❌       | HTTP server port (default: `3000`)        | `3000`                                           |
| `NODE_ENV`      | ❌       | Environment mode                          | `development`, `production`, `test`              |
| `BCRYPT_ROUNDS` | ❌       | bcrypt hashing rounds (default: `10`)     | `10` (12 recommended for production)             |

**For testing**, create a separate `.env.test`:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/finance_test
JWT_SECRET=test-secret-key-at-least-32-chars
NODE_ENV=test
```

---

## Database Setup

The Prisma schema defines three models: `User`, `Record`, `RefreshToken`.

Migrations are committed to the repository.
Never run `prisma migrate dev` in production.
Use `prisma migrate deploy` instead.

```bash
# Apply migrations to your database
npx prisma migrate deploy

# View your data in Prisma Studio
npx prisma studio

# Reset the database (drop + re-migrate + re-seed)
npx prisma migrate reset
```

### Seed Data (after `npm run prisma:seed`)

| Role    | Email                   | Password       |
|---------|-------------------------|----------------|
| Admin   | admin@finance.com       | Admin@1234     |
| Analyst | analyst@finance.com     | Analyst@1234   |
| Viewer  | viewer@finance.com      | Viewer@1234    |

---

## Running the Server

```bash
# Development — auto-restarts on file changes
npm run dev

# Production
npm start

# Check the live Swagger docs
open http://localhost:3000/docs
```

---

## API Reference

### Authentication

| Method | Endpoint            | Auth     | Description                          |
|--------|---------------------|----------|--------------------------------------|
| POST   | `/auth/register`    | None     | Register a new user                  |
| POST   | `/auth/login`       | None     | Login and receive JWT + refresh token|
| POST   | `/auth/refresh`     | None     | Rotate refresh token, get new tokens |
| POST   | `/auth/logout`      | ✅       | Revoke refresh token (logout)        |

### Users

| Method | Endpoint          | Auth Required | Role    | Description              |
|--------|-------------------|---------------|---------|--------------------------|
| GET    | `/users/me`       | ✅            | Any     | Get current user profile |
| GET    | `/users`          | ✅            | Admin   | List all users           |
| GET    | `/users/:id`      | ✅            | Admin   | Get a specific user      |
| PATCH  | `/users/:id`      | ✅            | Admin   | Update user details      |
| DELETE | `/users/:id`      | ✅            | Admin   | Deactivate a user        |

### Financial Records

| Method | Endpoint          | Auth Required | Role              | Description                     |
|--------|-------------------|---------------|-------------------|---------------------------------|
| GET    | `/records`        | ✅            | Any               | List records (with filters)     |
| GET    | `/records/:id`    | ✅            | Any               | Get a single record             |
| POST   | `/records`        | ✅            | Analyst / Admin   | Create a new record             |
| PATCH  | `/records/:id`    | ✅            | Analyst / Admin   | Update a record                 |
| DELETE | `/records/:id`    | ✅            | Analyst / Admin   | Soft-delete a record            |

### Dashboard Analytics

| Method | Endpoint                  | Auth Required | Description                         |
|--------|---------------------------|---------------|-------------------------------------|
| GET    | `/dashboard/summary`      | ✅            | Total income, expense, net balance  |
| GET    | `/dashboard/monthly`      | ✅            | Monthly income vs expense breakdown |

---

## Error Response Contract

**Every** error response — whether from validation, auth, or the server — follows this shape:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [ ... ]   // only present for validation errors
}
```

**Every** success response follows:

```json
{
  "success": true,
  "message": "Human-readable success description",
  "data": { ... }
}
```

Fastify's default error shape (`{ statusCode, error, message }`) never reaches the client — all errors are intercepted by the global `setErrorHandler`.

### Common HTTP Status Codes

| Code | Meaning                                |
|------|----------------------------------------|
| 200  | OK                                     |
| 201  | Created                                |
| 400  | Validation failed (missing/invalid fields) |
| 401  | Unauthorized (bad credentials / no token) |
| 403  | Forbidden (insufficient role)          |
| 404  | Resource not found                     |
| 409  | Conflict (e.g. duplicate email)        |
| 429  | Too many requests (rate limit)         |
| 500  | Internal server error                  |

---

## Role & Permission Matrix

| Action                     | VIEWER | ANALYST          | ADMIN    |
|----------------------------|--------|------------------|----------|
| Register / Login           | ✅     | ✅               | ✅       |
| View own profile (`/me`)   | ✅     | ✅               | ✅       |
| View Dashboard Summary     | ✅     | ✅               | ✅       |
| View Monthly Breakdown     | ✅     | ✅               | ✅       |
| List Records               | ❌     | ✅ (own only)    | ✅ all   |
| View Single Record         | ❌     | ✅ (own only)    | ✅ all   |
| Create Record              | ❌     | ✅               | ✅       |
| Update Record              | ❌     | ✅ (own only)    | ✅       |
| Soft-Delete Record         | ❌     | ✅ (own only)    | ✅       |
| List All Users             | ❌     | ❌               | ✅       |
| Get Any User               | ❌     | ❌               | ✅       |
| Update Any User            | ❌     | ❌               | ✅       |
| Deactivate User            | ❌     | ❌               | ✅       |

---

## Query Parameters

### `GET /records`

| Param            | Type    | Default | Description                            |
|------------------|---------|---------|----------------------------------------|
| `type`           | enum    | —       | `INCOME` or `EXPENSE`                  |
| `category`       | string  | —       | Partial match on category name         |
| `startDate`      | date    | —       | ISO 8601 date — filter from date       |
| `endDate`        | date    | —       | ISO 8601 date — filter to date         |
| `page`           | number  | `1`     | Page number for pagination             |
| `limit`          | number  | `10`    | Results per page (max: 100)            |
| `includeDeleted` | boolean | `false` | Include soft-deleted records           |

### `GET /dashboard/monthly`

| Param  | Type   | Default       | Description               |
|--------|--------|---------------|---------------------------|
| `year` | number | current year  | Calendar year to break down |

---

## Sample API Calls

### Register a New User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123"
  }'
```

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "clxyz...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "VIEWER",
    "status": "ACTIVE",
    "createdAt": "2026-04-06T00:00:00.000Z"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance.com",
    "password": "Admin@1234"
  }'
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "clxyz...",
      "name": "Admin User",
      "email": "admin@finance.com",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  }
}
```

### Create a Financial Record (Analyst / Admin)

```bash
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 75000,
    "type": "INCOME",
    "category": "Salary",
    "date": "2026-04-01",
    "notes": "April salary"
  }'
```

### Get Dashboard Summary

```bash
curl http://localhost:3000/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Dashboard summary fetched successfully",
  "data": {
    "totalIncome": 150000,
    "totalExpense": 45000,
    "netBalance": 105000,
    "recordCount": 12
  }
}
```

### Get Monthly Breakdown

```bash
curl "http://localhost:3000/dashboard/monthly?year=2026" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Running Tests

Tests require a separate PostgreSQL database configured in `.env.test`.

```bash
# Run all tests
npm test

# Run a specific test file
npx jest tests/auth.test.js --forceExit

# Run with coverage report
npx jest --coverage --forceExit
```

### Test Suite Overview

| Suite        | File                      | Tests | Description                                      |
|--------------|---------------------------|-------|--------------------------------------------------|
| Auth         | `tests/auth.test.js`      | 6     | Register, login, validation, duplicates          |
| Records      | `tests/records.test.js`   | 14    | CRUD, filters, pagination, role guards           |
| Dashboard    | `tests/dashboard.test.js` | 7     | Summary, monthly breakdown, analytics            |
| **Total**    |                           | **27**|                                                  |

**Expected result:**
```
Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
```

> **Note:** Tests run with `--runInBand` (sequential) to avoid database race conditions. The test setup cleans the database before and after each suite.

---

## Project Architecture

```
finance-backend/
├── src/
│   ├── app.js                      # Fastify bootstrap, plugin registration, global error handler
│   ├── server.js                   # Entry point — starts the HTTP server
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js      # Route definitions + JSON Schema validation
│   │   │   ├── auth.controller.js  # Request/response handling
│   │   │   └── auth.service.js     # Business logic (register, login)
│   │   ├── users/
│   │   │   ├── users.routes.js
│   │   │   ├── users.controller.js
│   │   │   └── users.service.js
│   │   ├── records/
│   │   │   ├── records.routes.js
│   │   │   ├── records.controller.js
│   │   │   └── records.service.js
│   │   └── dashboard/
│   │       ├── dashboard.routes.js
│   │       ├── dashboard.controller.js
│   │       └── dashboard.service.js
│   ├── middleware/
│   │   ├── authenticate.js         # Verifies JWT Bearer token
│   │   └── authorize.js            # Role-based access guard
│   ├── plugins/
│   │   ├── prisma.js               # Decorates fastify.prisma on the instance
│   │   └── swagger.js              # OpenAPI spec + Scalar UI
│   └── utils/
│       ├── errors.js               # Custom error classes (AppError, NotFoundError, etc.)
│       └── response.js             # successResponse / errorResponse helpers
├── prisma/
│   ├── schema.prisma               # Data models (User, FinancialRecord)
│   └── seed.js                     # Sample data seeder
├── tests/
│   ├── helpers.js                  # buildTestApp, createPrismaClient, cleanDb
│   ├── auth.test.js
│   ├── records.test.js
│   └── dashboard.test.js
├── .env.example
├── jest.config.js
└── package.json
```

### Request Flow

```
HTTP Request
    │
    ▼
Fastify Route (JSON Schema Validation)
    │
    ▼
authenticate (JWT verification)
    │
    ▼
authorize (role check)
    │
    ▼
Controller (parse request, call service)
    │
    ▼
Service (business logic)
    │
    ▼
Prisma (database query)
    │
    ▼
Controller (format and send response)
    │
    ▼
Global setErrorHandler (intercepts any thrown error)
    │
    ▼
HTTP Response { success, message, data? }
```

---

## Technical Decisions

### Fastify over Express
Fastify provides built-in JSON Schema validation at the route level, eliminating the need for external validation libraries like Joi or Zod. Its plugin-based architecture maps cleanly to modular backend design, and its serialization pipeline is significantly faster than Express.

### PostgreSQL + Prisma
Prisma makes the data model self-documenting through `schema.prisma`. PostgreSQL enables powerful aggregation queries (`DATE_TRUNC`, `GROUP BY`) used in the monthly trends endpoint — not possible with SQLite.

### Soft Delete for Audit Integrity
Financial records should never be permanently deleted. Setting `isDeleted: true` preserves full audit history while hiding records from normal queries. This is standard practice in financial and compliance-sensitive systems.

### Stateless JWT Authentication
No session store is required. Each request is self-contained — the token carries `userId` and `role`, verified on every protected request. This scales horizontally without sticky sessions.

### Consistent Error Shape
The global `setErrorHandler` in `app.js` intercepts every error and normalizes it to `{ success: false, message }`. Fastify's default error shape (`{ statusCode, error, message }`) never reaches the client. This contract is enforced across all 4 error categories: validation, auth/conflict, Prisma, and unexpected server errors.

### Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Refresh token rotation | Slightly more complex auth flow; enables immediate session revocation |
| No multi-role support | One role per user keeps RBAC simple and focused |
| No permanent delete | Requires manual DB cleanup for truly stale test data |
| Global rate limit | Per-route tuning would be more precise but increases config complexity |

### Prisma Migrations Version-Controlled

Prisma migrations are version-controlled alongside the codebase. This ensures schema changes are reproducible across all environments and prevents schema drift between development and production.

### bcrypt Rounds at 12

bcrypt rounds are set to 12 in production (up from the common default of 10) for stronger password hashing. Test environments use 4 rounds to keep the test suite fast.

---

## Assumptions

1. A user can only hold one role at a time (no multi-role support).
2. Financial record amounts are always positive; `type` (INCOME / EXPENSE) determines direction.
3. Soft-deleted records are excluded from all dashboard calculations and default record listings.
4. The monthly breakdown uses the calendar year as the default grouping period.
5. Admin users cannot deactivate their own account to prevent self-lockout.
6. Passwords are never returned in any response — the service layer strips them before returning user objects.
7. ANALYSTs can only view records they created. ADMINs have full visibility across all records.
8. When a user is deactivated, their financial records are preserved for audit purposes but their active sessions are immediately revoked. Records created by inactive users remain visible to ADMINs in dashboard summaries.

---

## Deployment

### Manual Git Push

```bash
git add .
git commit -m "your message"
git push origin main
```

### With Docker

```bash
cd finance-backend
docker-compose up --build -d
```

---

## What Was Improved (v2)

- Docker + docker-compose for one-command setup
- Prisma migrations committed for schema safety
- ANALYST data isolation (own records only)
- Refresh token rotation (30-day tokens, auto-revoke on deactivate)
- Dashboard date filtering on all endpoints
- Cascade session revocation on user deactivation
- GitHub Actions CI pipeline
- bcrypt rounds increased to 12 for production security

---

---

## API Documentation (Swagger)

Interactive API docs are auto-generated and available at:

```
http://localhost:3000/docs
```

All endpoints are documented with:
- Request body schemas
- Response schemas per status code
- Authentication requirements
- Tag groupings (Auth, Users, Records, Dashboard)

