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
- **Run Single Test**: `npm test -w <app-name> -- <path/to/test>` (Note: Configure test runner in package.json if adding new tests)
- **Linting**: `npm run lint -w guest-site`

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
- **Responses**: Use helpers from `middleware/response.js`:
  - `successResponse(res, data, message, statusCode)`
  - `errorResponse(res, message, errorCode, statusCode)`
- **Validation**: Every POST/PUT route must use Zod schemas in `middleware/validate.js` via the `validate(schema)` middleware.
- **Authentication**: Access/Refresh JWT tokens stored in HttpOnly cookies. Use `auth` middleware from `middleware/auth.js`.

### Frontend Architecture (`apps/guest-site`)
- **Framework**: React 19 (Functional Components + Hooks).
- **Styling**: Tailwind CSS 4.0. Prioritize utility classes over custom CSS.
- **Icons**: Use `lucide-react`.
- **Animations**: Use `framer-motion` for transitions.
- **Routing**: `react-router-dom` v7. Use Data APIs (loaders/actions) where appropriate.
- **Services**: All API calls must go through `src/services/api.js`. Do not use `fetch`/`axios` directly in components.

## Error Handling Mandates

### Backend
- Wrap all async controller logic in `try/catch`.
- Log errors with context: `console.error('[CONTEXT_ERROR]:', error)`.
- Use the global `errorHandler` middleware in `index.js` for final catching.
- Never leak stack traces to the client in production.

### Frontend
- Use optional chaining (`?.`) defensively.
- Implement `try/catch` in service calls.
- Use `ErrorBoundary` components for critical UI sections (Home, Booking).

## Database & Schema
- **Init**: Schema is defined in `db/init-db.js`.
- **Migrations**: Use the `addColumn` helper in `init-db.js` to add columns to existing tables.
- **UUIDs**: Use `uuid/v4` for public identifiers. Internal joins should use integer `id`.
- **Soft Deletes**: Use `deleted_at` (DATETIME) for non-permanent removals.
- **Integrity**: `PRAGMA foreign_keys = ON` is required.

## Agent Workflow Patterns

### Adding a New Admin Feature
1.  **Schema**: Update `db/init-db.js` if new tables/columns are needed.
2.  **Route**: Create a new file in `routes/` (e.g., `routes/housekeeping.js`).
3.  **Register**: Import and `app.use` the new route in `index.js`, passing the `db` instance.
4.  **View**: Create a new EJS file in `views/`.
5.  **Nav**: Add the link to `views/partials/header.ejs`.
6.  **Audit**: Log the action using `audit.log()` within the route.

### Adding a New Guest Page
1.  **Component**: Create the page in `src/pages/`.
2.  **Service**: Add any needed API methods to `src/services/api.js`.
3.  **Route**: Register the page in `src/App.jsx`.
4.  **Style**: Use Tailwind and Framer Motion for a "Cinematic" feel.

## Security Mandates
- **Tokens**: Never log JWT secrets or raw tokens.
- **Sanitization**: EJS handles basic escaping, but be careful with `<%-` (unescaped output).
- **Auth**: Always verify `res.locals.user` exists in protected routes.
- **PII**: Handle guest emails and phone numbers with care (no logging).

## Visual Standards (The "Elysian" Aesthetic)
- **Colors**: Use Stone, Zinc, and Slate palettes.
- **Typography**: Serif for headings (`font-serif`), Sans-serif for body (`Inter`).
- **White Space**: High margin/padding for a premium feel.
- **Transitions**: Subtle opacity fades and Y-axis slides on page entry.

## Deployment & Environments
- **Environment**: Check `isProduction` for cookie security (`secure: true`).
- **Secrets**: Use `.env` variables for `SESSION_SECRET` and `JWT_SECRET`.
- **Containers**: Refer to the root `Dockerfile` for build steps.
