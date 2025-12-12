# Bizflow

**AI-native business OS**

Bizflow is an intelligent business operating system designed for freelancers and solo founders, starting with the German market. Built on a modular kernel architecture, it can be configured for different business types (spaces) while maintaining a shared core.

## Architecture Overview

### Philosophy

Bizflow is built with a **kernel + spaces** architecture:

- **Kernel**: Core primitives (entities, workflows, AI layer) used across all business types
- **Spaces**: Opinionated configurations for specific business types
- **Modules**: Functional domains (finance, CRM, tasks) that are composed into spaces

### Current Implementation

**Bizflow Personal** - AI back office for 1-person businesses in Germany

Enabled modules:
- **Finance**: Invoices, receipts, VAT/tax calculations
- **CRM**: Client management
- **Tasks**: Task management and intelligent inbox

### Future Spaces

The architecture supports adding:
- Bizflow Holdings (multi-entity management)
- Bizflow Studio (agency/team operations)
- Bizflow Restaurant (hospitality)
- And more...

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **AI**: OpenAI/Anthropic (configurable)
- **Storage**: Local (dev) / S3-compatible (prod)
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- **Node.js** 20+ (or use Docker)
- **pnpm** 9+ (package manager - install with `npm install -g pnpm`)
- **PostgreSQL** 16+ (or use Docker Compose)
- **Docker** & **Docker Compose** (optional, for containerized setup)

### Installation

#### Option 1: Local Development

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bizflow.git
cd bizflow
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:
- `DATABASE_URL` - Your PostgreSQL connection string (see [docker setup](#docker-setup))
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `AI_API_KEY` - (Optional) Your OpenAI or Anthropic API key

4. Set up the database:

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:push

# Seed demo data
pnpm db:seed
```

5. Start the development server:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

#### Option 2: Using Docker Compose

See [Docker Setup](#docker-setup) section below for full container setup.

### Demo Credentials

After seeding:
- Email: `demo@bizflow.software`
- Password: `password123`

## Docker Setup

### Quick Start

Run the entire stack with Docker Compose:

```bash
# Start PostgreSQL + Next.js app
docker-compose up -d

# Watch logs
docker-compose logs -f

# Stop services
docker-compose down
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Services

The `docker-compose.yml` includes:

- **PostgreSQL 16-alpine** - Database service
  - Container: `bizflow-postgres`
  - Port: `5432`
  - Credentials:
    - Username: `bizflow`
    - Password: `bizflow_dev_password`
    - Database: `bizflow_dev`

- **Next.js App** - Application service
  - Container: `bizflow-app`
  - Port: `3000`
  - Database: `postgresql://bizflow:bizflow_dev_password@postgres:5432/bizflow_dev`

### Database Setup in Docker

When using Docker Compose, the app automatically:
1. Waits for PostgreSQL to be healthy
2. Generates the Prisma client
3. Runs database migrations
4. Seeds demo data

### Environment for Docker

When running with Docker, use this DATABASE_URL in `.env`:

```bash
DATABASE_URL="postgresql://bizflow:bizflow_dev_password@postgres:5432/bizflow_dev"
```

### Useful Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Remove volumes (clean database)
docker-compose down -v

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Execute command in running container
docker-compose exec app pnpm db:seed

# Rebuild images
docker-compose up --build
```

### Data Persistence

- PostgreSQL data is stored in the `postgres_data` volume
- Application uploads are stored in `./uploads/` directory
- Both are preserved when using `docker-compose down`
- Use `docker-compose down -v` to delete everything

### Network

Services communicate through the `bizflow-network` bridge network:
- App connects to PostgreSQL using hostname `postgres` (not `localhost`)
- Both services can be accessed from your machine on configured ports

### Production Deployment

For production, ensure:
1. Change `NEXTAUTH_SECRET` to a strong random value
2. Update `DATABASE_URL` to your production database
3. Set `NODE_ENV=production`
4. Configure proper storage (S3, etc.) instead of local uploads
5. Use strong credentials for PostgreSQL
6. Don't expose database port in production

## Project Structure

```
bizflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Public pages (marketing, login)
│   │   ├── (app)/             # Authenticated app pages
│   │   └── api/               # API routes
│   ├── modules/               # Functional modules
│   │   ├── kernel/            # Core primitives
│   │   │   ├── entities/      # Shared entity types
│   │   │   ├── workflows/     # Event system
│   │   │   └── ai/            # AI integration layer
│   │   ├── finance/           # Finance module
│   │   │   ├── entities/      # Domain types
│   │   │   ├── services/      # Business logic
│   │   │   └── workflows/     # Finance workflows
│   │   ├── crm/               # CRM module
│   │   └── tasks/             # Tasks & inbox module
│   ├── spaces/                # Space configurations
│   │   └── personal/          # Bizflow Personal config
│   └── lib/                   # Shared utilities
│       ├── db.ts              # Prisma client
│       ├── auth.ts            # Auth helpers
│       ├── ai.ts              # AI client wrapper
│       └── storage.ts         # File storage
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
└── tests/                     # Test files
```

## Key Concepts

### Spaces

A **space** represents a specific business type configuration. Each space:
- Enables specific modules
- Configures features (e.g., VAT support, currency)
- Defines UI elements (navigation, dashboards)

Example: `src/spaces/personal/spaceConfig.ts`

### Modules

**Modules** are functional domains that can be composed into spaces:

- **Finance**: Invoicing, expense tracking, tax calculations
- **CRM**: Client relationship management
- **Tasks**: Task management and intelligent inbox

### Workflows

The kernel provides an event-driven workflow system:

```typescript
import { emitEvent, onEvent } from '@/modules/kernel/workflows';

// Emit an event
await emitEvent('receipt.created', spaceId, { receiptId });

// Handle an event
onEvent('receipt.created', async (event) => {
  // Auto-categorise with AI, create inbox item, etc.
});
```

### AI Integration

AI features are abstracted through `src/lib/ai.ts`:

- Supports OpenAI and Anthropic
- Graceful fallback if no API key configured
- Used for receipt categorisation, tax explanations, etc.

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run test:ui      # Run tests with UI

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed demo data

# Docker
npm run docker:dev   # Start Docker services
```

## Database Schema

The schema supports multi-space (multi-business) operations:

**Core Models:**
- `User` - User accounts
- `Space` - Business workspaces
- `SpaceMembership` - User-space relationships

**Finance Models:**
- `Invoice` + `InvoiceLineItem`
- `Receipt`
- `TaxConfig`
- `TaxPeriod`

**CRM Models:**
- `Client`

**Tasks Models:**
- `Task`
- `InboxItem`

**Storage:**
- `File`

All business data is scoped to a `Space`.

## API Routes

All API routes require a `x-space-id` header for space context:

- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/receipts` - List receipts
- `POST /api/receipts` - Create receipt
- `GET /api/inbox` - List inbox items
- `GET /api/tax` - Get tax overview/periods

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t bizflow .
docker run -p 3000:3000 bizflow
```

### Environment Variables (Production)

```bash
DATABASE_URL=              # PostgreSQL connection
NEXTAUTH_SECRET=           # Min 32 characters
NEXTAUTH_URL=             # Your domain
AI_PROVIDER=              # openai or anthropic
AI_API_KEY=               # Your AI API key
FILE_STORAGE_BUCKET=      # S3 bucket name
FILE_STORAGE_ENDPOINT=    # S3 endpoint
FILE_STORAGE_ACCESS_KEY=  # S3 access key
FILE_STORAGE_SECRET_KEY=  # S3 secret key
```

## Development Roadmap

### v1 (Current)
- ✅ Multi-space architecture
- ✅ Bizflow Personal space
- ✅ Finance module (invoices, receipts, tax)
- ✅ CRM module (clients)
- ✅ Tasks & inbox module
- ✅ AI receipt categorisation
- ✅ Basic UI

### v2 (Planned)
- [ ] Real-time updates
- [ ] Advanced AI copilot
- [ ] Bank integration
- [ ] Document OCR
- [ ] Email integration
- [ ] Mobile app

### Future Spaces
- [ ] Bizflow Holdings
- [ ] Bizflow Studio
- [ ] Bizflow Restaurant

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## License

Proprietary - All rights reserved

## Support

- Documentation: [docs.bizflow.software](https://docs.bizflow.software)
- Issues: [GitHub Issues](https://github.com/yourusername/bizflow/issues)
- Email: support@bizflow.software

---

Built with ❤️ for freelancers and founders