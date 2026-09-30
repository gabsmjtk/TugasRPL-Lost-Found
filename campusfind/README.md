# CampusFind

CampusFind is a full-stack campus lost-and-found information system built with React, Vite, Node.js, Express, MySQL 8, and Prisma, using an npm-workspace monorepo structure.

## Prerequisites

- **Node.js** (v20+ recommended) and **npm**
- **Docker** and **Docker Compose** (for running the MySQL database locally)

## Environment Configuration

1. Copy `.env.example` to `.env` in the root folder for backend/database configuration:
   ```bash
   cp .env.example .env
   ```
2. Copy `apps/web/.env.example` to `apps/web/.env` for the frontend configuration:
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

## Setup and Installation

Install all workspace dependencies from the root directory:
```bash
npm install
```

## Docker Compose Usage

Start the MySQL 8 database using Docker Compose:
```bash
npm run db:start
```
To stop the database:
```bash
npm run db:stop
```

## Database Migration and Seeding

Once the database container is running, execute the following command to apply Prisma migrations and seed the database:
```bash
npm run db:migrate
npm run db:seed
```

### Seed Account Credentials

The seeder creates default accounts for testing. All seed accounts use the password: `password123`.

**Admin Account:**
- Email: `admin@campusfind.ac.id`

**Student Accounts:**
- Email: `student1@campusfind.ac.id`
- Email: `student2@campusfind.ac.id`
- Email: `student3@campusfind.ac.id`

## Startup Instructions (Development)

Run both the frontend and backend in development mode concurrently from the root directory:
```bash
npm run dev
```

Alternatively, you can run them individually:
- Backend API: `npm run dev --workspace=api`
- Frontend Web: `npm run dev --workspace=web`

## Production Build Commands

To build all workspaces (frontend, backend, and shared) for production:
```bash
npm run build
```

## Test Commands

To run tests (if implemented) across all workspaces:
```bash
npm test
```
To run linter:
```bash
npm run lint
```
