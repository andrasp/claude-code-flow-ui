# Gotchas

Non-obvious issues and environment quirks discovered during development.

---

## Cross-Origin Cookie Handling
**Source**: `feature/2024-12-20_jwt-auth`

When running frontend and backend on different ports in development, cookies require:
- `SameSite=None`
- `Secure=true` (requires HTTPS even in dev)
- Explicit `credentials: 'include'` in fetch calls

Dev workaround: Use a proxy in Vite config to serve API from same origin.

---

## React StrictMode Double Effects
**Source**: `feature/2025-01-05_websocket-infra`

React 18 StrictMode intentionally double-invokes effects in development. This causes WebSocket connections to be created twice, then one is cleaned up.

This is expected behavior, not a bug. The cleanup function must properly close connections.

---

## PostgreSQL JSONB Index Limitations
**Source**: `optimization/2025-01-08_query-profiling`

GIN indexes on JSONB columns only help with containment operators (`@>`, `?`, `?|`, `?&`). They don't help with:
- Equality comparisons on nested values
- Range queries on nested values
- Full-text search within JSON

For frequent access patterns, consider extracting to regular columns.

---

## Zustand Persist with SSR
**Source**: `feature/2025-01-02_dashboard-ui`

Using `persist` middleware causes hydration mismatches in SSR because localStorage doesn't exist on server.

Fix: Use `skipHydration: true` and manually hydrate on client mount.

---

## Socket.io Binary Data Encoding
**Source**: `feature/2025-01-05_websocket-infra`

Socket.io auto-detects and handles binary data, but this adds overhead. For cursor positions (high frequency, small payloads), use `JSON.stringify` explicitly to avoid binary encoding overhead.

---

## TypeScript Exact Optional Properties
**Source**: `feature/2025-01-02_dashboard-ui`

When using `exactOptionalPropertyTypes` in tsconfig, you can't assign `undefined` to optional properties - they must be omitted entirely.

```typescript
// With exactOptionalPropertyTypes: true
interface User {
  name?: string;
}

// Error: undefined is not assignable
const user: User = { name: undefined };

// OK: omit the property
const user: User = {};
```
