# RM-003: Real-time Collaboration

## Metadata
- **Status**: in-progress
- **Priority**: P1 (high)
- **Category**: feature
- **Effort**: L
- **Created**: 2024-12-20
- **Target**: Q1 2025

## Dependencies
- **Depends on**: RM-001
- **Enables**: RM-006

## Description

Add real-time collaboration features using WebSockets. Users should see each other's cursors, edits should sync instantly, and presence indicators should show who's online.

## Acceptance Criteria

- [x] WebSocket connection management with auto-reconnect
- [x] Presence indicators showing active users
- [ ] Real-time cursor position sharing
- [ ] Operational transform for concurrent edits
- [ ] Conflict resolution for simultaneous changes

## Notes

Using Socket.io for the WebSocket layer. Initial connection handling is complete, working on the OT algorithm now.

## Linked Flows

- `feature/2025-01-05_websocket-infra` - WebSocket infrastructure (completed)
- `feature/2025-01-09_realtime-cursors` - Cursor sharing (in progress)

## History

- 2024-12-20: Created
- 2025-01-05: Started WebSocket infrastructure
- 2025-01-08: WebSocket infra completed
- 2025-01-09: Started cursor sharing implementation
