# Lessons Learned

Mistakes made and knowledge gained during development workflows.

---

## Critical Severity

### Never Store Tokens in localStorage
**Source**: `feature/2024-12-20_jwt-auth`
**Impact**: Security vulnerability

localStorage is accessible to any JavaScript on the page, making it vulnerable to XSS attacks. Access tokens should be kept in memory; refresh tokens in httpOnly cookies.

**What happened**: Initially stored JWT in localStorage. Security review caught this before production.

### Always Validate Token Expiry Server-Side
**Source**: `bugfix/2024-12-28_token-refresh`
**Impact**: Authentication bypass

Don't trust client-provided expiry claims. Always validate exp claim server-side against current time.

**What happened**: Race condition allowed expired tokens to be used momentarily.

---

## High Severity

### WebSocket Authentication Must Be Re-validated
**Source**: `feature/2025-01-05_websocket-infra`
**Impact**: Unauthorized access

Initial HTTP handshake auth isn't sufficient. Validate auth on each message or implement ticket-based auth for WebSocket upgrade.

**What happened**: User could maintain WebSocket connection after logout.

### Database Indexes Don't Help INSERT-Heavy Tables Without Maintenance
**Source**: `optimization/2025-01-08_query-profiling`
**Impact**: Performance degradation

Adding indexes to tables with heavy INSERT load can cause performance issues. Need to balance read vs write performance and consider index maintenance.

**What happened**: Index improved SELECT but degraded INSERT by 40%.

---

## Medium Severity

### Zustand Selectors Are Worth the Effort
**Source**: `feature/2025-01-02_dashboard-ui`
**Impact**: UI performance

Dashboard was re-rendering on every store update. Adding proper selectors reduced renders by 80%.

**What happened**: Used destructuring instead of selectors, causing unnecessary re-renders.

### Test WebSocket Reconnection Thoroughly
**Source**: `feature/2025-01-05_websocket-infra`
**Impact**: User experience

Happy path testing isn't enough. Need to test network interruptions, server restarts, and authentication expiry during connection.

**What happened**: Reconnection logic worked in dev but failed in production due to auth token expiry.
