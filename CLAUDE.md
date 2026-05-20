# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Church Management System - a Next.js 14 web application for managing church operations including members, attendance, ministries, sermons, and communications.

## Development Commands

All commands run from the `my-app` directory:

```bash
cd my-app

# Development
npm run dev          # Start dev server at http://localhost:3000

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit (auth) + TanStack React Query (server state)
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors for auth
- **UI Components**: Headless UI, Heroicons, Framer Motion

### Project Structure (my-app/src)
```
app/                    # Next.js App Router pages
  (dashboard)/          # Route group for authenticated pages
  api/v1/              # API routes
components/
  auth/                # Auth guards (ProtectedRoute, RoleGuard)
  common/              # Reusable UI (Button, Card, Input, Modal, Loading)
  layout/              # Dashboard layout (Sidebar, Header)
lib/
  api-client.ts        # Axios instance with auth interceptors
  providers.tsx        # Redux + React Query providers
services/              # API service modules (auth, user, attendance, etc.)
store/
  slices/authSlice.ts  # Redux auth state
types/index.ts         # TypeScript interfaces and enums
```

### Authentication & Authorization
- JWT-based auth with access/refresh tokens stored in localStorage
- Middleware (`my-app/middleware.ts`) handles route protection
- Four user roles: `NEWCOMER`, `MEMBER`, `STAFF`, `ADMIN`
- Role-based routing:
  - `/admin/*` - Admin only
  - `/staff/*`, `/attendance/*`, `/analytics/*`, `/reports/*` - Staff + Admin
  - `/directory/*`, `/ministries/*`, `/media/*` - Member + Staff + Admin
  - `/dashboard/*`, `/profile/*`, `/services/*`, `/sermons/*` - All authenticated users

### API Pattern
- Base URL configured via `NEXT_PUBLIC_API_BASE_URL` env var (defaults to `/api/v1`)
- Services in `src/services/` wrap API calls with typed responses
- API responses follow `{ success: boolean, data: T, message?: string }` structure

### Path Alias
- `@/*` maps to `./src/*` (configured in tsconfig.json)

## Testing
Use Playwright for E2E tests. Run tests sequentially for database consistency.
