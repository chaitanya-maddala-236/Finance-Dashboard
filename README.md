# Finance Dashboard Backend API

> A production-quality REST API for managing
> financial records with role-based access control,
> built with Fastify, Prisma, and PostgreSQL.

## Tech Stack

| Technology      | Purpose              | Version  |
|-----------------|----------------------|----------|
| Node.js         | Runtime              | >= 18    |
| Fastify         | Web Framework        | v4       |
| Prisma          | ORM                  | v5       |
| PostgreSQL       | Database             | >= 14    |
| JWT             | Authentication       | -        |
| bcryptjs        | Password Hashing     | -        |
| Jest            | Testing              | -        |
| Swagger UI      | API Documentation    | -        |

---

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
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

# Seed with sample data (3 users + 50 records)
npx prisma db seed
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
  "documentation": "http://localhost:3000/docs"
}
```

---

## Test Credentials (after seeding)

| Role    | Email                  | Password      |
|---------|------------------------|---------------|
| Admin   | admin@finance.com      | Admin@123     |
| Analyst | analyst@finance.com    | Analyst@123   |
| Viewer  | viewer@finance.com     | Viewer@123    |

---

## Role Permissions

| Action                 | Viewer | Analyst | Admin |
|------------------------|--------|---------|-------|
| View Dashboard Summary |   ✅   |   ✅   |  ✅   |
| View Category Stats    |   ✅   |   ✅   |  ✅   |
| View Trends            |   ✅   |   ✅   |  ✅   |
| View Recent Activity   |   ✅   |   ✅   |  ✅   |
| List Records           |   ❌   |   ✅   |  ✅   |
| View Single Record     |   ❌   |   ✅   |  ✅   |
| Create Record          |   ❌   |   ❌   |  ✅   |
| Update Record          |   ❌   |   ❌   |  ✅   |
| Delete Record          |   ❌   |   ❌   |  ✅   |
| List Users             |   ❌   |   ❌   |  ✅   |
| Update User Role       |   ❌   |   ❌   |  ✅   |
| Update User Status     |   ❌   |   ❌   |  ✅   |

---

## API Endpoints

### Auth
| Method | Endpoint             | Auth     | Description          |
|--------|----------------------|----------|----------------------|
| POST   | /api/auth/register   | None     | Register new user    |
| POST   | /api/auth/login      | None     | Login, get JWT token |
| GET    | /api/auth/me         | Required | Get current user     |

### Users (Admin only)
| Method | Endpoint                   | Description         |
|--------|----------------------------|---------------------|
| GET    | /api/users                 | List all users      |
| GET    | /api/users/:id             | Get single user     |
| PATCH  | /api/users/:id/role        | Update user role    |
| PATCH  | /api/users/:id/status      | Activate/deactivate |

### Records
| Method | Endpoint          | Role Required    | Description       |
|--------|-------------------|------------------|-------------------|
| GET    | /api/records      | Analyst or Admin | List with filters |
| GET    | /api/records/:id  | Analyst or Admin | Get single record |
| POST   | /api/records      | Admin only       | Create record     |
| PUT    | /api/records/:id  | Admin only       | Update record     |
| DELETE | /api/records/:id  | Admin only       | Soft delete       |

### Dashboard (All roles)
| Method | Endpoint                   | Description              |
|--------|----------------------------|--------------------------|
| GET    | /api/dashboard/summary     | Totals and net balance   |
| GET    | /api/dashboard/categories  | Category-wise breakdown  |
| GET    | /api/dashboard/trends      | Monthly or weekly trends |
| GET    | /api/dashboard/recent      | Recent transactions      |

---

## Query Parameters

### GET /api/records
| Param      | Type   | Example        | Description               |
|------------|--------|----------------|---------------------------|
| type       | enum   | INCOME         | Filter by record type     |
| category   | string | food           | Partial match on category |
| startDate  | date   | 2026-01-01     | Filter from date          |
| endDate    | date   | 2026-03-31     | Filter to date            |
| search     | string | groceries      | Search in notes field     |
| page       | number | 1              | Page number               |
| limit      | number | 10             | Results per page (max 100)|
| sortBy     | enum   | amount         | date, amount, createdAt   |
| sortOrder  | enum   | asc            | asc or desc               |

### GET /api/dashboard/trends
| Param  | Type   | Default  | Description                  |
|--------|--------|----------|------------------------------|
| period | enum   | monthly  | monthly or weekly            |
| year   | number | current  | Year to fetch trends for     |

---

## Sample API Calls

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password@123",
    "role": "ANALYST"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance.com",
    "password": "Admin@123"
  }'
```

### Create Record (Admin)
```bash
curl -X POST http://localhost:3000/api/records \
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
curl http://localhost:3000/api/dashboard/summary \
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
└── seed.js                    # 50 realistic seed records
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
- Rate limiting was not implemented to keep scope appropriate
  for the assignment.

---

## Assumptions Made

1. A user can only have one role at a time (no multi-role support).
2. Financial record amounts are always positive; type (INCOME/EXPENSE)
   determines direction.
3. Soft-deleted records are excluded from all dashboard calculations.
4. The trends endpoint uses calendar year as the default grouping period.
5. Admin users cannot deactivate their own account to prevent lockout.

---

## API Documentation

Interactive Swagger docs available at:
**http://localhost:3000/docs**

All endpoints are documented with request/response schemas,
authentication requirements, and example values.
