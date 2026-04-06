# Finance Dashboard Backend API

<img src="https://github.com/chaitanya-maddala-236/Finance-Dashboard/actions/workflows/ci.yml/badge.svg">

A production-quality Finance Dashboard Backend API built with Node.js, Fastify, Prisma, and PostgreSQL.

## Tech Stack

| Component    | Technology                         |
|--------------|------------------------------------|
| Runtime      | Node.js (ES Modules)               |
| Framework    | Fastify                            |
| ORM          | Prisma v5                          |
| Database     | PostgreSQL                         |
| Auth         | JWT + Refresh Tokens               |
| Validation   | Fastify built-in JSON Schema       |
| Docs         | @fastify/swagger + @fastify/swagger-ui |
| Hashing      | bcryptjs                           |

## Project Structure

```
finance-backend/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── records/
│   │   └── dashboard/
│   ├── middleware/
│   ├── plugins/
│   └── utils/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── .env.example
├── Dockerfile
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database

### Installation

```bash
cd finance-backend
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run local dev migrations
npm run prisma:migrate

# Seed data
npm run prisma:seed
```

Migrations are committed to the repository.  
Never run `prisma migrate dev` in production.  
Use `prisma migrate deploy` instead.

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## Docker Setup

### Run with Docker (Recommended)
```bash
# Copy env file
cp .env.example .env

# Edit .env with your JWT_SECRET

# Start everything (Postgres + API + seed)
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

## API Documentation

Interactive API docs: **http://localhost:3000/docs**

## API Endpoints

### Auth
| Method | Path             | Description |
|--------|------------------|-------------|
| POST   | /auth/register   | Register new user |
| POST   | /auth/login      | Login, get access + refresh tokens |
| POST   | /auth/refresh    | Rotate refresh token and issue new tokens |
| POST   | /auth/logout     | Revoke refresh token |
| GET    | /auth/me         | Get current user |

### Users
| Method | Path          | Description                     | Required Role |
|--------|---------------|---------------------------------|---------------|
| GET    | /users/me     | Get own profile                 | Any           |
| GET    | /users        | List all users                  | ADMIN         |
| GET    | /users/:id    | Get user by ID                  | ADMIN         |
| PATCH  | /users/:id    | Update user                     | ADMIN         |
| DELETE | /users/:id    | Deactivate user                 | ADMIN         |

### Records
| Method | Path            | Description                     | Required Role |
|--------|-----------------|---------------------------------|---------------|
| GET    | /records        | List records                    | Any           |
| GET    | /records/:id    | Get record by ID                | Any           |
| POST   | /records        | Create new record               | ADMIN         |
| PATCH  | /records/:id    | Update record                   | ADMIN         |
| DELETE | /records/:id    | Soft-delete record              | ADMIN         |

### Dashboard
| Method | Path                   | Description                     | Required Role |
|--------|------------------------|---------------------------------|---------------|
| GET    | /dashboard/summary     | Summary totals                  | Any           |
| GET    | /dashboard/categories  | Category aggregation            | Any           |
| GET    | /dashboard/recent      | Recent records                  | Any           |
| GET    | /dashboard/trends      | Trend breakdown                 | Any           |
| GET    | /dashboard/monthly     | Monthly income vs expense       | Any           |

## Role Permissions

| Action                 | Viewer | Analyst      | Admin    |
|------------------------|--------|--------------|----------|
| View Dashboard Summary |   ✅   |   ✅         |  ✅      |
| List Records           |   ❌   | ✅ (own only)|  ✅ all  |
| View Single Record     |   ❌   | ✅ (own only)|  ✅ all  |
| Create Record          |   ❌   |   ❌         |  ✅      |
| Update Record          |   ❌   |   ❌         |  ✅      |
| Delete Record (soft)   |   ❌   |   ❌         |  ✅      |

## Data Models

### User
`id, name, email, password, role, status, createdAt, updatedAt`

### RefreshToken
`id, token, userId, expiresAt, createdAt, isRevoked`

### Record
`id, amount, type, category, date, notes, isDeleted, createdById, createdAt, updatedAt`

## Assumptions

- ANALYSTs can only view records they created. ADMINs have full visibility across all records.
- When a user is deactivated, their financial records are preserved for audit purposes but their active sessions are immediately revoked. Records created by inactive users remain visible to ADMINs in dashboard summaries.

## Technical Decisions

- Prisma migrations are version-controlled alongside the codebase. This ensures schema changes are reproducible across all environments and prevents schema drift between development and production.
- bcrypt rounds are set to 12 in production (up from the common default of 10) for stronger password hashing. Test environments use 4 rounds to keep the test suite fast.

## Deployment

### Manual Git Push
```bash
git add .
git commit -m "your message"
git push origin main
```

### With Docker
```bash
docker-compose up --build -d
```

## What Was Improved (v2)
- Docker + docker-compose for one-command setup
- Prisma migrations committed for schema safety  
- ANALYST data isolation (own records only)
- Refresh token rotation (30-day tokens, auto-revoke on deactivate)
- Dashboard date filtering on all endpoints
- Cascade session revocation on user deactivation
- GitHub Actions CI pipeline
- bcrypt rounds increased to 12 for production security
