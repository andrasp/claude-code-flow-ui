# Real-time Cursor Sharing Plan

**Type:** Feature
**Created:** 2025-01-09
**Status:** In Progress

## Overview

Implement real-time cursor position sharing for the collaborative editing feature. Users should see other collaborators' cursors and selections in real-time.

## Roadmap Reference

- **Item**: RM-003 (Real-time Collaboration)
- **Priority**: P1 (high)
- **Acceptance Criteria**:
  - [x] WebSocket connection management with auto-reconnect
  - [x] Presence indicators showing active users
  - [ ] Real-time cursor position sharing
  - [ ] Operational transform for concurrent edits
  - [ ] Conflict resolution for simultaneous changes

## Goals

- [ ] Display remote user cursors with name labels
- [ ] Show remote user selections (highlighted ranges)
- [ ] Smooth cursor movement (interpolation)
- [ ] Handle cursor positions during text changes
- [ ] Optimize for high-frequency updates

## Approach

1. **Data Structure**: Send minimal cursor data (documentId, position, userId)
2. **Update Frequency**: Throttle to 50ms, batch position updates
3. **Interpolation**: Smooth cursor movement on receiving end
4. **Position Mapping**: Use document version + character offset
5. **Rendering**: Overlay layer with absolute positioning

## Success Criteria

- [ ] Cursor updates visible within 100ms
- [ ] No visible jitter during fast movement
- [ ] Cursors remain accurate after local edits
- [ ] Works with 10+ simultaneous users
- [ ] Graceful degradation on slow connections
