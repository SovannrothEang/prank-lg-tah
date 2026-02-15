# Agent Instructions - Hotel Management System

This document provides essential information for agentic coding agents operating in this repository. Adhere to these guidelines to maintain consistency and quality.

## Project Overview

This is a monorepo containing a luxury hotel management system:
- `apps/admin-dashboard`: Express/EJS backend for staff and administrative management.
- `apps/guest-site`: React 19/Vite/Tailwind frontend for guest bookings and exploration.
- `packages/`: (Planned) Shared utilities and components.

## Commands

### Root Commands
Execute these from the project root:
- **Full Development**: `npm run dev` (Runs both apps concurrently using `concurrently`)
- **Admin App Only**: `npm run admin:dev`
- **Guest App Only**: `npm run guest:dev`

### Workspace Specific Commands
- **Install Dependencies**: `npm install` (from root to install all workspace deps)
- **Run Tests**: `npm test -w <app-name>` (e.g., `npm test -w admin-dashboard`)
- **Run Single Test**: `npm test -w <app-name> -- <path/to/test>`
- **Linting**: `npm run lint -w guest-site`
- **Database Seeding**: `npm run seed -w admin-dashboard` (Injects luxury mock data)

## Code Style Guidelines

### General
- **Indentation**: 
  - Backend (JS/EJS): 4 spaces.
  - Frontend (JSX/CSS): 2 spaces.
  - Frontend (Pure JS): 4 spaces.
- **Semicolons**: Always used.
- **Naming**:
  - Files: `PascalCase` for React Components/Services, `kebab-case` or `camelCase` for others.
  - Variables/Functions: `camelCase`.
  - Constants: `UPPER_SNAKE_CASE`.
- **Imports**:
  - Backend: Use `require` (CommonJS).
  - Frontend: Use `import` (ESM).
  - Group imports: Built-ins first, then Third-party, then Local.

### Backend Architecture (`apps/admin-dashboard`)
- **Module System**: CommonJS.
- **Framework**: Express.js with EJS templating.
- **Routing**: Modular route files in `routes/`. Export a function that receives `(db)` and returns a `router`.
- **Database**: SQLite via `sqlite` (wrapper) and `sqlite3`.
  - Use UPPERCASE for SQL keywords.
  - Use `db` instance passed through routes.
  - Always use `async/await` for DB operations.
- **Real-time**: Socket.io integrated in `index.js`. Use `io.emit()` for dashboard notifications.
- **Responses**: Use helpers from `middleware/response.js`:
  - `successResponse(res, data, message, statusCode)`
  - `errorResponse(res, message, errorCode, statusCode)`
- **Validation**: Every POST/PUT route must use Zod schemas in `middleware/validate.js`.
- **Authentication**: JWT-based. Access (1h) and Refresh (7d) tokens in HttpOnly cookies.
- **RBAC**: Use `adminOnly` and `managerOnly` middlewares from `middleware/auth.js`.
  - `staff`: Basic operations (Bookings, POS, Housekeeping). Cannot see reports or modify inventory/menu.
  - `manager`: Can modify inventory/menu and see reports.
  - `admin`: Full system access including staff management and database tools.

### Frontend Architecture (`apps/guest-site`)
- **Framework**: React 19 (Functional Components + Hooks).
- **Styling**: Tailwind CSS 4.0. Prioritize utility classes.
- **Icons**: Use `lucide-react`.
- **Animations**: `framer-motion` for transitions and cinematic entry effects.
- **Routing**: `react-router-dom` v7. Use `AnimatePresence` for page transitions.
- **Services**: All API calls must go through `src/services/api.js`.

## Error Handling Mandates

### Backend
- Wrap all async controller logic in `try/catch`.
- Log errors with context: `console.error('[CONTEXT_ERROR]:', error)`.
- Use the global `errorHandler` middleware in `index.js`.

### Frontend
- Use optional chaining (`?.`) defensively.
- Use `ErrorBoundary` for critical UI sections (Home, Booking).

## Database & Schema
- **Init**: Schema is defined in `db/init-db.js`.
- **Migrations**: Use the `addColumn` helper in `init-db.js` for non-destructive updates.
- **CRM**: Centralized `guests` table identifies guests by unique `phone_number`.
- **Invoicing**: Integrated `room_charges` for POS/Restaurant billing.
- **Integrity**: `PRAGMA foreign_keys = ON` is required.

## Agent Workflow Patterns

### Adding a New Admin Feature
1.  **Schema**: Update `db/init-db.js` (add tables/columns).
2.  **Route**: Create file in `routes/` (receive `db` or `db, io`).
3.  **Register**: Import and `app.use` in `index.js`.
4.  **View**: Create EJS file in `views/` using `partials/header` and `footer`.
5.  **Audit**: Log actions using `audit.log()`.

### Adding a New Guest Page
1.  **Component**: Create page in `src/pages/`.
2.  **Route**: Register in `src/App.jsx` inside `AnimatedRoutes`.
3.  **Style**: Use "Elysian" standards (Zinc/Stone colors, Serif headers).

## Security Mandates
- **Tokens**: Never log JWT secrets. Use `SESSION_SECRET` from `.env`.
- **Sanitization**: Be extremely careful with `<%-` in EJS (unescaped output).
- **Auth**: Verify `res.locals.user` exists in protected routes.
- **PII**: Protect guest emails and phone numbers.

## Visual Standards (The "Elysian" Aesthetic)
- **Colors**: Zinc (`#09090b`), Stone, and subtle Gold/Amber accents.
- **Typography**: `Playfair Display` (Serif) for headings, `Inter` (Sans) for body.
- **UX**: Subtle "Noise" grain overlay and 0.6s opacity/Y-axis page transitions.
- **Borders**: 1px Zinc-200 for cards instead of heavy shadows.

## Deployment & Environments
- **Secrets**: Use `.env` variables for `SESSION_SECRET` and `TELEGRAM_BOT_TOKEN`.
- **Production**: `NODE_ENV=production` enforces `secure: true` on cookies.
