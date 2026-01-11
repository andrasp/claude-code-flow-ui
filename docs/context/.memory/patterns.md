# Patterns

Established patterns discovered during development workflows.

---

## Authentication

### JWT Token Structure
**Source**: `feature/2024-12-20_jwt-auth`
**Confidence**: High

Use short-lived access tokens (15 min) with longer-lived refresh tokens (7 days). Store refresh tokens in httpOnly cookies, access tokens in memory only.

```typescript
interface TokenPayload {
  sub: string;        // user id
  iat: number;        // issued at
  exp: number;        // expiration
  type: 'access' | 'refresh';
}
```

### Refresh Token Rotation
**Source**: `bugfix/2024-12-28_token-refresh`
**Confidence**: High

Always rotate refresh tokens on use. Invalidate the old token immediately to prevent replay attacks. Store token family ID to detect token theft.

---

## React Components

### Component File Structure
**Source**: `feature/2025-01-02_dashboard-ui`
**Confidence**: High

```
ComponentName/
  index.ts          # Re-export
  ComponentName.tsx # Main component
  types.ts          # TypeScript interfaces
  hooks.ts          # Component-specific hooks
  utils.ts          # Helper functions
```

### State Management with Zustand
**Source**: `feature/2025-01-02_dashboard-ui`
**Confidence**: High

Create separate stores for distinct domains. Use selectors to minimize re-renders:

```typescript
// Good - only re-renders when user changes
const user = useUserStore(state => state.user)

// Bad - re-renders on any store change
const { user } = useUserStore()
```

---

## WebSocket

### Connection Management
**Source**: `feature/2025-01-05_websocket-infra`
**Confidence**: Medium

Use exponential backoff for reconnection with jitter to prevent thundering herd:

```typescript
const delay = Math.min(1000 * 2 ** attempt, 30000) + Math.random() * 1000;
```

Heartbeat every 30 seconds to detect stale connections.

---

## Database

### Query Patterns
**Source**: `optimization/2025-01-08_query-profiling`
**Confidence**: High

Always include composite indexes for queries with multiple WHERE clauses in common access patterns:

```sql
-- For queries like: WHERE user_id = ? AND created_at > ?
CREATE INDEX idx_user_created ON documents(user_id, created_at);
```
