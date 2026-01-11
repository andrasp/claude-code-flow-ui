# Redis Caching Research

**Plan:** [plan.md](./plan.md)

## Findings

### Current Performance Analysis

Query profiling from APM (DataDog):
- Document listing: 800ms average, 2.3s P95
- Main bottleneck: `SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC`
- Secondary queries: user preferences, folder metadata

### Redis Client Comparison

| Library | Pros | Cons |
|---------|------|------|
| ioredis | Cluster support, Lua scripting, Pipelining | Larger bundle |
| node-redis | Official, smaller | Less features |

**Decision**: Use `ioredis` for cluster support and Lua scripting (needed for atomic operations).

### Cache Invalidation Strategies

1. **TTL-based**: Simple but allows stale data
2. **Write-through**: Consistent but adds write latency
3. **Pub/sub**: Scalable but adds complexity

**Decision**: Hybrid approach - TTL for reads, pub/sub invalidation on writes.

### Cache Key Design

```
Pattern: docs:{scope}:{identifier}:{operation}:{hash}

Examples:
- docs:user:123:list:abc123        # User's document list
- docs:user:123:recent:def456      # User's recent documents
- docs:folder:789:contents:ghi789  # Folder contents
```

Hash is computed from filter parameters to differentiate cached queries.

## Key Insights

1. **80% of queries are repeated within 5 minutes** - High cache hit potential
2. **Document updates are relatively rare** - Invalidation overhead is low
3. **User-specific caches are more effective** - Shared caches have low hit rates
4. **Redis cluster needed for HA** - Single node is a SPOF
