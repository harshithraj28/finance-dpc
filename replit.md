# Financial Tracking System

## Overview
A production-ready full-stack financial tracking application built with React, Node.js (Express), and PostgreSQL. This SaaS-style application enables users to manage their personal finances with debits, credits, transaction history, and exportable reports.

## Features

### Authentication
- **Replit Auth Integration**: Secure authentication via OpenID Connect
- Supports Google, GitHub, X, Apple, and email/password login
- User-specific data isolation
- Session management with PostgreSQL storage

### Dashboard
- Real-time financial overview
- Total credit (income)
- Total debit (expenses)
- Outstanding balance (credit - debit)
- Today's activity summary
- Trend charts showing balance over time

### Transaction Management
- **Add Debit**: Record expenses with amount, category, notes, and date
- **Add Credit**: Record income with amount, category, notes, and date
- Categories for organizing transactions (Salary, Rent, Groceries, etc.)
- Edit and delete transactions
- Search and filter by date range, category, or type

### Reports
- Daily summary reports (total credit, debit, net change)
- Full transaction history with pagination
- Export functionality:
  - PDF reports with professional layout
  - PNG image exports
  - Printable format

### Data Persistence
- Cloud-synced PostgreSQL database
- Automatic data seeding for new users
- All data persists across sessions and devices

## Technology Stack

### Frontend
- React 18 with TypeScript
- Wouter for routing
- TanStack Query (React Query) for data fetching
- Shadcn UI components with Tailwind CSS
- Recharts for data visualization
- html2canvas & jspdf for export functionality

### Backend
- Node.js with Express
- TypeScript
- Drizzle ORM for database operations
- Zod for request validation
- Passport.js with OpenID Connect

### Database
- PostgreSQL (Neon-backed)
- Drizzle schema with relations
- Session storage for authentication

## Architecture

### Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Landing, Dashboard, Transactions, Reports
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and query client
├── server/              # Express backend
│   ├── replit_integrations/  # Replit Auth module
│   ├── db.ts           # Database connection
│   ├── storage.ts      # Data access layer
│   └── routes.ts       # API endpoints
├── shared/              # Shared types between frontend/backend
│   ├── schema.ts       # Drizzle tables and Zod schemas
│   └── routes.ts       # API contract definitions
```

### API Endpoints
All routes are protected with authentication:

**Categories**
- `GET /api/categories` - List user categories
- `POST /api/categories` - Create new category

**Transactions**
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

**Reports**
- `GET /api/reports/dashboard` - Dashboard summary
- `GET /api/reports/daily` - Daily reports

**Auth**
- `GET /api/login` - Initiate login
- `GET /api/logout` - Logout
- `GET /api/auth/user` - Get current user

## Database Schema

### Tables
- **users**: User accounts (managed by Replit Auth)
- **sessions**: Session storage (managed by Replit Auth)
- **categories**: Transaction categories (user-specific)
- **transactions**: Financial transactions (user-specific)
- **daily_reports**: Daily summary reports (user-specific)

### Relationships
- Categories have many Transactions
- All tables reference users for data isolation

## Getting Started

1. **Login**: Click "Get Started" on the landing page
2. **Seed Data**: New users automatically receive example transactions
3. **Add Transactions**: Use the modals to add debits (expenses) or credits (income)
4. **View Reports**: Navigate to Reports to see daily summaries
5. **Export**: Click export buttons to generate PDF/PNG reports

## User Preferences
- Modern, minimal design with clean typography
- Blue/indigo accent colors
- Green indicators for positive balances (credit)
- Red indicators for negative balances (debit)
- Fully responsive (mobile, tablet, desktop)
- Dark mode support (optional, can be added)

## Security
- Password hashing via Replit Auth
- Session-based authentication with secure cookies
- User data isolation (all queries filtered by userId)
- Input validation with Zod schemas
- Protected API routes with middleware

## Recent Changes
- 2026-02-24: Initial production build completed
  - Full authentication with Replit Auth
  - Complete CRUD operations for transactions
  - Dashboard with real-time metrics
  - Export functionality (PDF/PNG)
  - Auto-seed for new users
