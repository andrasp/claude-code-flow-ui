# Token Refresh Race Condition Fix Plan

**Type:** Bugfix
**Created:** 2024-12-28
**Status:** Complete

## Overview

Fix a race condition in the token refresh flow where multiple simultaneous requests could cause authentication failures. When multiple API calls detected an expired token at the same time, each would attempt to refresh, causing token invalidation issues.

## Bug Description

**Symptom**: Users randomly logged out during normal usage
**Frequency**: ~5% of sessions affected
**Environment**: Production only (higher concurrency than dev)

**Root Cause**: When access token expired, multiple in-flight requests would detect this simultaneously and each would call the refresh endpoint. Due to token rotation, only the first refresh succeeded - subsequent refreshes used an already-invalidated refresh token.

## Goals

- [x] Prevent multiple concurrent refresh token requests
- [x] Queue pending requests during token refresh
- [x] Retry failed requests after successful refresh
- [x] Add proper error handling for refresh failures

## Approach

1. Implement a refresh token mutex using a Promise-based lock
2. Queue requests that arrive during refresh
3. Retry queued requests with new token after refresh completes
4. If refresh fails, redirect all queued requests to login

## Success Criteria

- [x] No concurrent refresh token requests
- [x] All in-flight requests succeed after token refresh
- [x] Graceful redirect to login on refresh failure
- [x] No user-visible interruption during normal token refresh
