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

- Node.js 20+
- PostgreSQL 16+
- npm 10+

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bizflow.git
cd bizflow
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `AI_API_KEY` - (Optional) Your OpenAI or Anthropic API key

4. Set up the database:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:push

# Seed demo data
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After seeding:
- Email: `demo@bizflow.software`
- Password: `password123`

## Docker Setup

Run the entire stack with Docker:

```bash
# Start PostgreSQL + app
npm run docker:dev

# Or manually:
docker-compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000)

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