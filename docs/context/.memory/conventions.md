# Conventions

Coding standards and conventions observed in this codebase.

---

## Naming

### Files and Directories
- React components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Test files: `*.test.ts` or `*.spec.ts`
- Type definition files: `types.ts`

### Variables and Functions
- Functions: `camelCase` verbs (`getUser`, `validateToken`)
- Boolean variables: `is`/`has`/`should` prefix (`isLoading`, `hasError`)
- Constants: `SCREAMING_SNAKE_CASE` for true constants only
- Event handlers: `handle` prefix (`handleClick`, `handleSubmit`)

### React Components
- Component names: `PascalCase`
- Props interfaces: `ComponentNameProps`
- Hook names: `use` prefix (`useAuth`, `useWebSocket`)

---

## Code Style

### TypeScript
- Prefer `interface` over `type` for object shapes
- Use explicit return types on exported functions
- Avoid `any` - use `unknown` and narrow

### React
- Functional components only, no class components
- Hooks at top of component, before any conditions
- Extract complex logic to custom hooks
- Memoize expensive computations with `useMemo`

### Error Handling
- Use custom error classes extending `Error`
- Include error codes for programmatic handling
- Log errors with structured data (JSON)

```typescript
class AuthError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'UNAUTHORIZED'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
```

---

## File Structure

### React Component
```typescript
// Imports - external first, then internal
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Types
interface Props {
  id: string;
}

// Component
export function ComponentName({ id }: Props) {
  // Hooks first
  const [state, setState] = useState()

  // Effects
  useEffect(() => {}, [])

  // Handlers
  const handleClick = () => {}

  // Render
  return <div />
}
```

### API Route Handler
```typescript
// Validation schema
const schema = z.object({...})

// Handler
export async function handler(req: Request, res: Response) {
  // 1. Parse and validate input
  // 2. Check authorization
  // 3. Execute business logic
  // 4. Return response
}
```

---

## Git Conventions

### Commit Messages
```
type(scope): short description

- Bullet points for details
- Keep lines under 72 chars

Refs: #123
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`

### Branch Names
- Feature: `feature/short-description`
- Bugfix: `fix/issue-description`
- Refactor: `refactor/what-changed`
