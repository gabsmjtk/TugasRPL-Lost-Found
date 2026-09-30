# CampusFind

Build a full-stack web application named **CampusFind**.

## Purpose

CampusFind is a campus lost-and-found information system. It gives students one central place to report lost items, report found items, search reports, and submit ownership claims. Campus officers manage reports, verify claims, and record completed handovers.

The application replaces scattered WhatsApp messages, social-media posts, and personal chats with searchable, structured, and traceable records.

The application supports two roles:

* **Mahasiswa**: creates and manages their own reports, searches reports, and submits claims.
* **Admin/Petugas Kampus**: reviews all reports and claims, changes report status, and records returned items.

## Stack

Use this stack:

* Frontend: React + TypeScript + Vite
* Styling: Tailwind CSS
* Icons: Lucide React
* Backend: Node.js + TypeScript + Express
* Database: MySQL 8
* ORM: Prisma
* Authentication: JWT with bcrypt password hashing
* File upload: Multer; store uploaded images locally in `apps/api/uploads/`
* API style: REST API returning JSON
* Database runtime: Docker Compose
* Package manager: npm workspaces

Use Indonesian for every visible label, button, validation message, empty state, and status text.

## Code Rules

* Use TypeScript in the frontend, backend, and shared package.
* Use PascalCase for classes, interfaces, types, enums, React components, API DTOs, and JSON property names.
* Local variables and functions may use camelCase.
* Keep code lines below 150 characters where practical.
* Do not add comments unless they are necessary to clarify non-obvious logic.
* Validate all request bodies and route parameters in the backend.
* Return consistent JSON errors containing `Message` and, when useful, `Errors`.
* Never expose password hashes, JWT secrets, or internal database errors in API responses.

## Application Features

### 1. Authentication

The application provides these public pages:

* **Daftar**: name, student number, email, password, and password confirmation.
* **Masuk**: email and password.

Authentication rules:

* Email and `StudentNumber` must be unique.
* Password must contain at least 8 characters.
* Store passwords only as bcrypt hashes.
* A newly registered account has role `STUDENT`.
* Persist the JWT access token in local storage for this first version.
* Protect all report creation, claim, profile, and administration routes.
* Redirect unauthenticated users to the login page for protected pages.
* A student may only edit or delete their own reports and view their own claims.
* Only an admin may access administration routes.

### 2. Landing Page and Public Search

The landing page presents:

* CampusFind branding and a short explanation of the service.
* Calls to action: `Laporkan Barang Hilang`, `Laporkan Barang Ditemukan`, and `Cari Barang`.
* A search field that searches report title, description, category, and location.
* Recent verified reports.
* Summary counts: open lost reports, open found reports, and completed handovers.
* A clear explanation that users should not place sensitive personal details in public descriptions.

The public report list supports:

* Keyword search.
* Filter by report type: `LOST` or `FOUND`.
* Filter by category, location, status, and date range.
* Sort by newest or oldest report.
* Pagination.
* Loading, empty, and error states.

### 3. Lost and Found Reports

Authenticated students can create a report by choosing either `Barang Hilang` or `Barang Ditemukan`.

Each report form contains:

* Title / item name.
* Report type.
* Category.
* Brand (optional).
* Color (optional).
* Description.
* Location.
* Event date and time.
* Up to three images, each optional.

Report rules:

* Title, type, category, description, location, and event date are required.
* Description must be between 20 and 1,000 characters.
* Images must be JPEG, PNG, or WebP and no larger than 5 MB each.
* New reports begin with status `PENDING` and are not public until an admin verifies them.
* A student may edit or delete a report only while its status is `PENDING` or `OPEN`.
* An admin may set a verified report to `OPEN`, `MATCHED`, `CLAIMED`, `RETURNED`, `REJECTED`, or `ARCHIVED`.
* A report with status `RETURNED`, `REJECTED`, or `ARCHIVED` cannot be edited by a student.

### 4. Report Detail and Similar Reports

The report detail page shows:

* Report images, title, category, attributes, description, location, date, and current status.
* The reporter name displayed only as a first name and initial; do not show email or student number publicly.
* Report creation time and last update time.
* A `Laporkan Klaim` button for eligible found-item reports.
* A `Tandai Sudah Ditemukan` action for the owner of an open lost-item report.
* Similar verified reports based on matching category and report type opposite to the current report, ordered by nearest event date.

### 5. Claims and Verification

Students can submit an ownership claim only for a verified, open `FOUND` report.

The claim form contains:

* An answer to a proof question provided by the claimant.
* Additional ownership description.
* Contact phone number for the campus officer.

Claim rules:

* A student cannot claim their own report.
* A student can submit only one active claim for the same report.
* New claims begin with status `PENDING`.
* Admins can approve or reject claims and must enter a decision note.
* Approving a claim changes the related report status to `CLAIMED`.
* A rejected claim does not close the report.
* The claimant sees claim status and the admin decision note in `Klaim Saya`.

### 6. Handover Records

When an approved claim is fulfilled, an admin records the handover:

* Handover date and time.
* Campus handover location.
* Admin notes.
* Recipient name confirmation.

Completing a handover changes the related report status to `RETURNED` and the approved claim status to `COMPLETED`. These records are immutable after completion; an admin may add a correction note but must not delete the audit trail.

### 7. Student Dashboard

The student dashboard shows:

* Summary cards for `Laporan Saya`, `Klaim Aktif`, and `Barang Dikembalikan`.
* The student’s recent reports with type, status, and latest update.
* The student’s recent claims with claim status.
* Quick actions to create a lost or found report.

### 8. Admin Dashboard and Management

The admin dashboard shows:

* Summary cards: pending reports, open reports, pending claims, and returned items.
* A table of reports awaiting verification.
* A table of claims awaiting a decision.
* Recent administrative activity.

Admin management pages provide:

* Report verification, status updates, archive action, and moderator notes.
* Claim review, approval, rejection, and decision notes.
* Handover recording for approved claims.
* Category CRUD management.
* User list with search, role display, and an action to activate or deactivate an account.

An admin cannot delete a report, claim, or handover record; use statuses and audit information instead.

### 9. Shared Layout and User Experience

The shared application layout includes:

* Responsive navigation bar with role-aware menu items.
* Footer with a short CampusFind description.
* Responsive cards, tables, forms, modal/dialog confirmations, and pagination controls.
* Toast messages for successful and failed actions.
* Loading skeletons or spinners, empty states, and friendly error states.
* A confirmation dialog before deleting an eligible report.

Use these status badge colors:

* `PENDING`: yellow
* `OPEN`: blue
* `MATCHED`: purple
* `CLAIMED`: orange
* `RETURNED`: green
* `REJECTED`: red
* `ARCHIVED`: gray

## Data Models

### User

* Id
* Name
* StudentNumber (nullable for admins)
* Email
* PasswordHash
* Role (`STUDENT` or `ADMIN`)
* IsActive
* CreatedAt
* UpdatedAt

### Category

* Id
* Name
* Description (optional)
* IsActive
* CreatedAt
* UpdatedAt

Seed these active categories: Elektronik, Aksesori, Dokumen, Pakaian, Buku dan Alat Tulis, Kunci, Dompet, dan Lainnya.

### Report

* Id
* ReporterId
* CategoryId
* Type (`LOST` or `FOUND`)
* Status (`PENDING`, `OPEN`, `MATCHED`, `CLAIMED`, `RETURNED`, `REJECTED`, or `ARCHIVED`)
* Title
* Brand (optional)
* Color (optional)
* Description
* Location
* EventAt
* VerifiedAt (optional)
* VerifiedById (optional)
* ModeratorNote (optional)
* CreatedAt
* UpdatedAt

### ReportImage

* Id
* ReportId
* FileName
* FilePath
* MimeType
* SortOrder
* CreatedAt

### Claim

* Id
* ReportId
* ClaimantId
* ProofAnswer
* OwnershipDescription
* ContactPhone
* Status (`PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, or `CANCELLED`)
* DecisionNote (optional)
* DecidedById (optional)
* DecidedAt (optional)
* CreatedAt
* UpdatedAt

### Handover

* Id
* ReportId
* ClaimId
* AdminId
* RecipientName
* HandoverLocation
* HandedOverAt
* Note (optional)
* CorrectionNote (optional)
* CreatedAt

### AuditLog

* Id
* ActorId
* EntityType
* EntityId
* Action
* Details (optional JSON)
* CreatedAt

## Database Rules

* Use Prisma migrations for all schema changes.
* Add foreign keys and useful indexes for report listing, search filters, and claim lookup.
* `User.Email` must be unique.
* `User.StudentNumber` must be unique when present.
* `Category.Name` must be unique.
* Add a unique composite constraint for `Claim.ReportId` and `Claim.ClaimantId`.
* Never physically delete claims, handovers, or audit logs.
* Create an audit-log entry whenever an admin verifies a report, changes a report status, decides a claim, records a handover, or changes user activation.
* Seed one admin account, three student accounts, the default categories, and at least six sample reports in mixed statuses. Document the seed login credentials in the README.

## REST API Routes

All routes are prefixed with `/api`.

### Authentication

* `POST /api/auth/register` — Register a student account.
* `POST /api/auth/login` — Authenticate a user and return an access token plus safe user data.
* `GET /api/auth/me` — Return the authenticated user.

### Public Reports and Categories

* `GET /api/reports` — List verified reports with search, filtering, sorting, and pagination.
* `GET /api/reports/:Id` — Return a verified report detail with images and similar reports.
* `GET /api/categories` — Return active categories.

Supported report query parameters:

* `Search`
* `Type`
* `CategoryId`
* `Location`
* `Status`
* `DateFrom`
* `DateTo`
* `Sort` (`newest` or `oldest`)
* `Page`
* `PageSize`

### Student Reports and Claims

* `POST /api/reports` — Create a report, including multipart image upload.
* `PUT /api/reports/:Id` — Update the authenticated student’s eligible report.
* `DELETE /api/reports/:Id` — Delete the authenticated student’s eligible report.
* `POST /api/reports/:Id/mark-found` — Mark the authenticated student’s open lost report as matched.
* `GET /api/me/reports` — Return the authenticated student’s reports.
* `POST /api/reports/:Id/claims` — Submit an ownership claim.
* `GET /api/me/claims` — Return the authenticated student’s claims.
* `POST /api/claims/:Id/cancel` — Cancel the authenticated student’s pending claim.
* `GET /api/me/dashboard` — Return the authenticated student dashboard data.

### Administration

* `GET /api/admin/dashboard` — Return dashboard summaries and pending queues.
* `GET /api/admin/reports` — List all reports, including unverified records.
* `PATCH /api/admin/reports/:Id/verify` — Verify or reject a pending report.
* `PATCH /api/admin/reports/:Id/status` — Change a report status with a moderator note.
* `GET /api/admin/claims` — List all claims with filtering by status.
* `PATCH /api/admin/claims/:Id/decision` — Approve or reject a claim.
* `POST /api/admin/handovers` — Record a handover for an approved claim.
* `GET /api/admin/categories` — List all categories.
* `POST /api/admin/categories` — Create a category.
* `PUT /api/admin/categories/:Id` — Update a category.
* `PATCH /api/admin/categories/:Id/active` — Activate or deactivate a category.
* `GET /api/admin/users` — List users with search and role filters.
* `PATCH /api/admin/users/:Id/active` — Activate or deactivate a user.

### Service

* `GET /api/health` — Return service health status.

## API Response Models

Define shared TypeScript response and request types for at least:

* `ApiError`
* `AuthResponse`
* `PaginatedResponse<T>`
* `UserSummary`
* `Category`
* `ReportSummary`
* `ReportDetail`
* `ClaimSummary`
* `Handover`
* `StudentDashboardResponse`
* `AdminDashboardResponse`

The backend must map Prisma entities into shared API models before sending a response. The frontend must not import Prisma types.

## Project Structure

Use an npm-workspace TypeScript monorepo with this structure:

```text
campusfind/
  apps/
    web/
      src/
        components/
        pages/
        services/
        hooks/
        contexts/
        types/
    api/
      prisma/
        schema.prisma
        seed.ts
      src/
        controllers/
        routes/
        services/
        middleware/
        validators/
        utils/
      uploads/
  packages/
    shared/
      src/
        models/
        enums/
        dto/
        index.ts
  docker-compose.yml
  package.json
  .env.example
  README.md
```

Create `packages/shared` with package name `@campusfind/shared`.

Shared-package rules:

* Put shared domain models, enums, DTOs, and constants in `@campusfind/shared`.
* Both `apps/web` and `apps/api` must import shared types from this package.
* Do not duplicate domain model definitions between frontend and backend.
* Prisma models remain inside the API application because they are database-specific.
* Configure workspace dependencies, TypeScript paths, build scripts, and development scripts so all packages compile successfully.

## Environment Configuration

Provide `.env.example` files without secrets.

Root or API environment variables:

```env
DATABASE_URL="mysql://campusfind:campusfind@localhost:3306/campusfind"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="1d"
PORT=3001
CLIENT_URL="http://localhost:5173"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE_MB=5
```

Frontend environment variables:

```env
VITE_API_URL="http://localhost:3001/api"
```

## Docker and Startup

Provide `docker-compose.yml` for MySQL 8 with:

* A named volume for database persistence.
* Database name `campusfind`.
* Non-root application user `campusfind`.
* A health check.
* Port `3306` exposed for local development.

Provide npm scripts for:

* Starting MySQL with Docker Compose.
* Running Prisma migration and seed.
* Starting API and web development servers.
* Building all workspaces.
* Running lint and tests.

## Verification

Add backend tests for the important business rules:

* Registration rejects duplicate email and duplicate student number.
* Login rejects an incorrect password.
* A student cannot edit another student’s report.
* An unverified report does not appear in the public report list.
* A claim cannot be submitted for the claimant’s own report.
* A duplicate active claim for the same report is rejected.
* Only an admin can verify reports, decide claims, or record handovers.
* Recording a handover changes report and claim statuses correctly.

The README must explain:

* Prerequisites.
* Environment configuration.
* Docker Compose usage.
* Database migration and seeding.
* Frontend and backend startup.
* Seed-account credentials.
* Production build commands.
* Test commands.

## Deliverables

* Complete frontend, backend, and shared-package source code.
* Prisma schema, migrations, and seed data.
* Docker Compose configuration for MySQL.
* `.env.example` files.
* README with complete local setup and usage instructions.
* Responsive Indonesian user interface.
* Working authentication, report lifecycle, claim verification, handover records, and admin dashboard.
* A successful production build and passing tests for the listed business rules.
