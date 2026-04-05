# Finance Dashboard Backend API

> A production-quality REST API for managing
> financial records with role-based access control,
> built with Fastify, Prisma, and PostgreSQL.

## Tech Stack

| Technology      | Purpose              | Version  |
|-----------------|----------------------|----------|
| Node.js         | Runtime              | >= 20    |
| Fastify         | Web Framework        | v5       |
| Prisma          | ORM                  | v5       |
| PostgreSQL       | Database             | >= 14    |
| JWT             | Authentication       | -        |
| bcryptjs        | Password Hashing     | -        |
| Jest            | Testing              | -        |
| Swagger UI      | API Documentation    | -        |

---

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL >= 14
- npm >= 9

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable        | Description                    | Example                                           |
|-----------------|--------------------------------|---------------------------------------------------|
| DATABASE_URL    | PostgreSQL connection string   | postgresql://user:pass@localhost:5432/financedb   |
| JWT_SECRET      | Secret key for JWT signing     | your-super-secret-key                             |
| JWT_EXPIRES_IN  | Token expiry duration          | 7d                                                |
| PORT            | Server port                    | 3000                                              |
| NODE_ENV        | Environment                    | development                                       |
| BCRYPT_ROUNDS   | Password hashing rounds        | 10                                                |

### 4. Database Setup
```bash
# Run migrations
npx prisma migrate dev --name init

# Seed with sample data (3 users + 5 records)
npm run prisma:seed
```

### 5. Start the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 6. Verify It's Running

Open `http://localhost:3000` — you should see:
```json
{
  "success": true,
  "message": "Finance Dashboard API is running 🚀",
  "version": "1.0.0",
  "documentation": "/docs"
}
```

---

## Test Credentials (after seeding)

| Role    | Email                  | Password       |
|---------|------------------------|----------------|
| Admin   | admin@finance.com      | Admin@1234     |
| Analyst | analyst@finance.com    | Analyst@1234   |
| Viewer  | viewer@finance.com     | Viewer@1234    |

---

## Role Permissions

| Action                 | Viewer | Analyst | Admin |
|------------------------|--------|---------|-------|
| View Dashboard Summary |   ✅   |   ✅   |  ✅   |
| View Monthly Breakdown |   ✅   |   ✅   |  ✅   |
| List Records           |   ✅   |   ✅   |  ✅   |
| View Single Record     |   ✅   |   ✅   |  ✅   |
| Create Record          |   ❌   |   ✅   |  ✅   |
| Update Record          |   ❌   |   ✅   |  ✅   |
| Delete Record          |   ❌   |   ✅   |  ✅   |
| View Own Profile       |   ✅   |   ✅   |  ✅   |
| List Users             |   ❌   |   ❌   |  ✅   |
| Update User            |   ❌   |   ❌   |  ✅   |
| Deactivate User        |   ❌   |   ❌   |  ✅   |

---

## API Endpoints

### Auth
| Method | Endpoint         | Auth     | Description          |
|--------|------------------|----------|----------------------|
| POST   | /auth/register   | None     | Register new user    |
| POST   | /auth/login      | None     | Login, get JWT token |
| GET    | /users/me        | Required | Get current user     |

### Users (Admin only)
| Method | Endpoint       | Description         |
|--------|----------------|---------------------|
| GET    | /users         | List all users      |
| GET    | /users/:id     | Get single user     |
| PATCH  | /users/:id     | Update user         |
| DELETE | /users/:id     | Deactivate user     |

### Records
| Method | Endpoint       | Role Required         | Description       |
|--------|----------------|-----------------------|-------------------|
| GET    | /records       | Any authenticated     | List with filters |
| GET    | /records/:id   | Any authenticated     | Get single record |
| POST   | /records       | Analyst or Admin      | Create record     |
| PATCH  | /records/:id   | Analyst or Admin      | Update record     |
| DELETE | /records/:id   | Analyst or Admin      | Soft delete       |

### Dashboard (All authenticated roles)
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /dashboard/summary    | Totals and net balance   |
| GET    | /dashboard/monthly    | Monthly income vs expense|

---

## Query Parameters

### GET /records
| Param          | Type    | Example        | Description                  |
|----------------|---------|----------------|------------------------------|
| type           | enum    | INCOME         | Filter by record type        |
| category       | string  | food           | Partial match on category    |
| startDate      | date    | 2026-01-01     | Filter from date             |
| endDate        | date    | 2026-03-31     | Filter to date               |
| page           | number  | 1              | Page number                  |
| limit          | number  | 10             | Results per page (max 100)   |
| includeDeleted | boolean | false          | Include soft-deleted records |

### GET /dashboard/monthly
| Param  | Type   | Default  | Description                  |
|--------|--------|----------|------------------------------|
| year   | number | current  | Year to fetch breakdown for  |

---

## Sample API Calls

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password@123"
  }'
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

### Create Record (Analyst or Admin)
```bash
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 50000,
    "type": "INCOME",
    "category": "Salary",
    "date": "2026-04-01",
    "notes": "April salary"
  }'
```

### Dashboard Summary
```bash
curl http://localhost:3000/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Architecture

```
src/
├── app.js                     # Fastify bootstrap + plugin registration
├── modules/
│   ├── auth/                  # Login, register, /me
│   ├── users/                 # User management (Admin only)
│   ├── records/               # Financial records CRUD
│   └── dashboard/             # Aggregation and analytics
├── middleware/
│   ├── authenticate.js        # JWT verification
│   └── authorize.js           # Role-based guard
├── plugins/
│   ├── prisma.js              # Prisma as Fastify plugin
│   └── swagger.js             # Swagger/OpenAPI setup
└── utils/
    ├── errors.js              # Custom error classes
    └── response.js            # Standard response helpers

prisma/
├── schema.prisma              # Data models
└── seed.js                    # Sample seed records
```

Request flow:
```
Request → Route → authenticate → authorize → Controller → Service → Prisma → DB
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx jest tests/auth.test.js

# Run with coverage
npx jest --coverage
```

### Test Coverage
| Module    | Tests  |
|-----------|--------|
| Auth      | Register, Login, /me, validation, duplicates |
| Records   | CRUD, filtering, pagination, role guards      |
| Dashboard | Summary, categories, trends, recent          |

---

## Technical Decisions & Trade-offs

### Why Fastify over Express?
Fastify provides built-in JSON Schema validation at the route level,
eliminating the need for external validation libraries like Joi or Zod.
Its plugin-based architecture also maps cleanly to modular backend design.

### Why PostgreSQL + Prisma?
Prisma makes the data model self-documenting through schema.prisma.
PostgreSQL enables powerful aggregation queries (DATE_TRUNC, GROUP BY)
used in the trends endpoint — this would not be possible with SQLite.

### Why Soft Delete?
Financial records should never be permanently deleted for audit purposes.
Setting isDeleted: true preserves history while hiding records from
normal queries.

### Why stateless JWT?
No session store required. Each request is self-contained.
The token carries userId and role, verified on every protected request.

### Trade-offs
- SQLite would have been simpler but PostgreSQL demonstrates
  real-world data modeling.
- A separate refresh token system was skipped to keep auth
  simple and focused on the core requirements.
- Basic rate limiting is enabled globally via `@fastify/rate-limit`,
  while more advanced per-route tuning was kept minimal to keep
  the assignment scope focused.

---

## Assumptions Made

1. A user can only have one role at a time (no multi-role support).
2. Financial record amounts are always positive; type (INCOME/EXPENSE)
   determines direction.
3. Soft-deleted records are excluded from all dashboard calculations.
4. The monthly breakdown endpoint uses calendar year as the default grouping period.
5. Admin users cannot deactivate their own account to prevent lockout.

---

## API Documentation

Interactive Swagger docs available at:
**http://localhost:3000/docs**

All endpoints are documented with request/response schemas,
authentication requirements, and example values.
