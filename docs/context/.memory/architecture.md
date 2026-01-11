# Architecture

High-level system structure and design decisions.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React + TypeScript + Zustand + TailwindCSS                 │
│  Served via Vite (dev) / Static hosting (prod)              │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐    ┌──────────┐    ┌───────────┐
        │ REST API│    │WebSocket │    │   CDN     │
        │ Express │    │Socket.io │    │ (assets)  │
        └────┬────┘    └────┬─────┘    └───────────┘
             │              │
             └──────┬───────┘
                    ▼
           ┌───────────────┐
           │   Services    │
           │ Auth, Users,  │
           │ Docs, Collab  │
           └───────┬───────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │PostgreSQL│ │ Redis  │ │  S3    │
   │ (data)   │ │(cache) │ │(files) │
   └──────────┘ └────────┘ └────────┘
```

---

## Key Design Decisions

### Stateless API Servers
All servers are stateless. Session state is in Redis, persistent data in PostgreSQL. This enables horizontal scaling.

### Event-Driven Collaboration
Real-time features use an event-driven architecture. Changes are published to Redis pub/sub, then broadcast to relevant WebSocket connections.

### Repository Pattern for Data Access
All database access goes through repository classes. This abstracts the ORM and makes testing easier.

```typescript
// Good
class UserRepository {
  async findById(id: string): Promise<User | null>
  async save(user: User): Promise<void>
}

// Bad - direct ORM usage in services
const user = await prisma.user.findUnique({ where: { id } })
```

---

## Module Boundaries

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| auth | Authentication, sessions, tokens | users |
| users | User profiles, preferences | - |
| documents | Document CRUD, versioning | users |
| collaboration | Real-time sync, presence | documents, users |
| notifications | Push, email, in-app | users |

Cross-module communication is via service interfaces, not direct repository access.

---

## Data Flow Patterns

### Write Path
1. API receives request
2. Service validates and processes
3. Repository persists to PostgreSQL
4. Event published to Redis
5. WebSocket broadcasts to subscribers

### Read Path
1. API receives request
2. Check Redis cache
3. If miss: query PostgreSQL, cache result
4. Return response
