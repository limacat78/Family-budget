# Family Budget Manager

## Overview

This is a comprehensive family budget management application built with React and Express. The app allows family members to track personal and household expenses, manage income, set vacation savings goals, and monitor financial health through interactive dashboards and visualizations.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: React Query for server state management
- **Form Management**: React Hook Form with Zod validation
- **Charts**: Chart.js for data visualization
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL storage
- **Validation**: Zod schemas for request validation

### Project Structure
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── types/       # TypeScript type definitions
│   │   └── utils/       # Helper functions
├── server/          # Express backend
│   ├── routes.ts    # API route handlers
│   ├── storage.ts   # Database abstraction layer
│   └── index.ts     # Server entry point
├── shared/          # Shared code between frontend and backend
│   └── schema.ts    # Database schema and validation
└── migrations/      # Database migration files
```

## Key Components

### User Management
- Multi-user support with simple user switching
- Two primary users: "Cat" and "Gui"
- User-specific personal transactions and income tracking

### Financial Tracking
- **Personal Finances**: Individual income and expense tracking per user
- **Household Expenses**: Shared expenses with tracking of who paid
- **Vacation Savings**: Goal setting and contribution tracking
- **Categories**: Predefined categories with emoji icons for visual appeal

### Data Visualization
- Overview cards showing key financial metrics
- Interactive charts for expense breakdown and trends
- Monthly transaction views with filtering capabilities
- Progress tracking for savings goals

### Form Management
- Compact, responsive forms for adding transactions
- Real-time validation using Zod schemas
- Consistent styling across all forms
- Date picker integration for transaction dates

## Data Flow

### Database Schema
- `users`: User accounts and authentication
- `incomes`: Personal income records
- `personal_expenses`: Individual user expenses
- `household_expenses`: Shared household costs
- `vacation_goal`: Savings targets for vacations
- `vacation_destinations`: Planned vacation details
- `vacation_contributions`: Individual contributions to vacation fund

### API Endpoints
- `/api/income` - Income management (GET, POST, DELETE)
- `/api/personal-expense` - Personal expense tracking
- `/api/household-expense` - Household expense management
- `/api/vacation-goal` - Vacation savings goal management
- `/api/vacation-contribution` - Vacation contribution tracking
- `/api/summary` - Aggregated financial data

### State Management
- React Query handles server state caching and synchronization
- Automatic background refetching ensures data consistency
- Optimistic updates for better user experience
- Error handling with user-friendly toast notifications

## External Dependencies

### Frontend Dependencies
- React Query for API state management
- Radix UI for accessible component primitives
- Tailwind CSS for utility-first styling
- Chart.js for data visualization
- React Hook Form for form management
- Zod for runtime type checking and validation
- Date-fns for date manipulation

### Backend Dependencies
- Drizzle ORM for type-safe database operations
- Neon Database serverless PostgreSQL driver
- Express.js for server framework
- Zod for request validation
- Connect-pg-simple for PostgreSQL session storage

## Deployment Strategy

### Development Environment
- Vite dev server for hot module replacement
- Express server with TypeScript compilation
- Environment variables for database configuration
- Replit-specific optimizations for cloud development

### Production Build
- Vite builds optimized static assets
- esbuild bundles the Express server
- Single deployment artifact combining frontend and backend
- Environment-based configuration management

### Database Management
- Drizzle Kit for schema migrations
- PostgreSQL database with connection pooling
- Automatic schema synchronization in development
- Production-ready connection handling

## Changelog

- July 20, 2025. Moved "Fundo Obras" from household to personal expense categories
- July 20, 2025. Applied special fund behavior to "Fundo Obras" (excluded from expense calculations and charts)
- July 20, 2025. Excluded special fund categories from daily average spending calculations
- July 17, 2025. Added "Fundo Obras" exclusion from household expense statistics and charts
- July 06, 2025. Removed original Dashboard page and set Personal tab as default
- July 06, 2025. Added Annual Dashboard ("Resumo Anual") with comprehensive yearly financial data
- July 05, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.