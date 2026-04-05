# Finance Dashboard Backend API

A production-quality Finance Dashboard Backend API built with Node.js, Fastify v4, Prisma v5, and PostgreSQL.

## Tech Stack

| Component    | Technology                         |
|--------------|------------------------------------|
| Runtime      | Node.js (ES Modules)               |
| Framework    | Fastify v4                         |
| ORM          | Prisma v5                          |
| Database     | PostgreSQL                         |
| Auth         | JWT (jsonwebtoken)                 |
| Validation   | Fastify built-in JSON Schema       |
| Docs         | @fastify/swagger + @fastify/swagger-ui |
| Hashing      | bcryptjs                           |

## Project Structure

```
finance-backend/
├── src/
│   ├── app.js                        ← Fastify instance + plugin registration
│   ├── server.js                     ← Entry point
│   ├── modules/
│   │   ├── auth/                     ← Register & Login
│   │   ├── users/                    ← User management (Admin)
│   │   ├── records/                  ← Financial records CRUD
│   │   └── dashboard/                ← Summary & analytics
│   ├── middleware/
│   │   ├── authenticate.js           ← JWT verification
│   │   └── authorize.js              ← Role-based access control
│   ├── plugins/
│   │   ├── prisma.js                 ← PrismaClient Fastify plugin
│   │   └── swagger.js                ← OpenAPI 3.0 docs
│   └── utils/
│       ├── errors.js                 ← Custom error classes
│       └── response.js               ← Response helpers
├── prisma/
│   ├── schema.prisma                 ← Database schema
│   └── seed.js                       ← Seed data
├── .env.example
└── package.json
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

# Run migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed
```

### Running the Server

```bash
# Development (with file watching)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000` by default.

---

## API Documentation

Interactive API docs are available at: **http://localhost:3000/docs**

---

## API Endpoints

### Auth
| Method | Path             | Description          | Auth Required |
|--------|-----------------|----------------------|---------------|
| POST   | /auth/register  | Register new user    | No            |
| POST   | /auth/login     | Login, get JWT token | No            |

### Users
| Method | Path          | Description                     | Required Role |
|--------|---------------|---------------------------------|---------------|
| GET    | /users/me     | Get own profile                 | Any           |
| GET    | /users        | List all users                  | ADMIN         |
| GET    | /users/:id    | Get user by ID                  | ADMIN         |
| PATCH  | /users/:id    | Update user                     | ADMIN         |
| DELETE | /users/:id    | Deactivate user (soft delete)   | ADMIN         |

### Records
| Method | Path            | Description                     | Required Role |
|--------|-----------------|---------------------------------|---------------|
| GET    | /records        | List records (filtered)         | Any           |
| GET    | /records/:id    | Get record by ID                | Any           |
| POST   | /records        | Create new record               | ANALYST+      |
| PATCH  | /records/:id    | Update record                   | ANALYST+      |
| DELETE | /records/:id    | Soft-delete record              | ANALYST+      |

### Dashboard
| Method | Path                   | Description                     | Required Role |
|--------|------------------------|---------------------------------|---------------|
| GET    | /dashboard/summary     | Financial summary & stats       | Any           |
| GET    | /dashboard/monthly     | Monthly income vs expense       | Any           |

### Health
| Method | Path     | Description   |
|--------|----------|---------------|
| GET    | /health  | Health check  |

---

## Roles & Permissions

| Role     | Records Access                | Users Access |
|----------|-------------------------------|--------------|
| VIEWER   | Read own records only         | Own profile  |
| ANALYST  | Create/update/delete own records | Own profile |
| ADMIN    | Full access to all records    | Full CRUD    |

---

## Data Models

### User
```
id, name, email, password (hashed), role (VIEWER/ANALYST/ADMIN),
status (ACTIVE/INACTIVE), createdAt, updatedAt
```

### Record
```
id, amount, type (INCOME/EXPENSE), category, date, notes,
isDeleted (soft delete), createdById, createdAt, updatedAt
```

---

## Seed Users

After running `npm run prisma:seed`:

| Email                   | Password       | Role     |
|-------------------------|----------------|----------|
| admin@finance.com       | Admin@1234     | ADMIN    |
| analyst@finance.com     | Analyst@1234   | ANALYST  |
| viewer@finance.com      | Viewer@1234    | VIEWER   |

---

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Obtain a token by calling `POST /auth/login`.

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": null
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```
