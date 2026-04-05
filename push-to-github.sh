#!/bin/bash
set -euo pipefail

# Step 1: Make sure you are in the project root
# (the folder containing src/, prisma/, package.json)

# Step 2: Initialize git if not already done
git init

# Step 3: Add remote (replace with your actual URL)
# If remote already exists, update the URL instead
if git remote get-url origin &>/dev/null; then
  git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
else
  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
fi

# Step 4: Stage everything
git add .

# Step 5: Verify what will be committed (check node_modules is NOT listed)
git status

# Step 6: Commit
git commit -m "feat: complete finance dashboard backend API

- Fastify + Prisma + PostgreSQL
- JWT authentication with bcrypt password hashing
- Role-based access control (VIEWER, ANALYST, ADMIN)
- Financial records CRUD with soft delete
- Advanced filtering, pagination, and search
- Dashboard APIs with SQL aggregation and trends
- Swagger documentation at /docs
- Jest test suite
- Seed script with sample records"

# Step 7: Push to main branch
git branch -M main
git push -u origin main
