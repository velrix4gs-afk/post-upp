

# Real-Time Everywhere + Offline Cache

## Current State
- **Messages** (`useMessages.ts`): Already has real-time subscriptions for INSERT/UPDATE/DELETE + cache via `CacheHelper`
- **Stories** (`useStories.ts`): Already has real-time subscription but re-fetches everything on any change
- **Notifications** (`useNotifications.ts`): Already has real-time INSERT subscription
- **Feed/Posts** (`useFeed.ts`, `usePosts.ts`): NO real-time subscriptions, NO caching
- **Cache** (`asyncStorage.ts`): Has helpers for feed, chats, messages, profiles — but feed cache is never used
- **IndexedDB cache** (`cache.ts`): Exists but is barely used

## Plan

### 1. Add real-time to `useFeed.ts`
- Subscribe to `postgres_changes` on `posts` table (INSERT, UPDATE, DELETE)
- On INSERT: prepend new post to feed (fetch profile inline)
- On UPDATE: update the matching post in state
- On DELETE: remove from state
- Load cached feed from `CacheHelper.getFeed()` on mount before fetching
- Save fetched feed to `CacheHelper.saveFeed()` after each fetch

### 2. Add real-time to `usePosts.ts`
- Subscribe to `postgres_changes` on `posts` table for INSERT/UPDATE/DELETE
- Same pattern: update local state directly from payload without full re-fetch
- Cache posts via `CacheHelper.saveFeed()`

### 3. Improve `useStories.ts` real-time
- Instead of re-fetching all stories on every change, handle INSERT/DELETE directly in state
- Cache stories in `CacheHelper` (add `saveStories`/`getStories` methods to `asyncStorage.ts`)

### 4. Extend `asyncStorage.ts` cache
- Add `saveStories` / `getStories` with 2-minute expiry
- Add `saveNotifications` / `getNotifications` with 1-minute expiry
- Increase feed cache expiry from 5 min to 30 min (offline-first, real-time handles freshness)

### 5. Add offline caching to `useNotifications.ts`
- Load cached notifications on mount before fetch
- Save to cache after fetch

### 6. Increase cache TTLs for offline use
- Feed: 5 min → 30 min
- Chats: 2 min → 30 min
- Messages: 1 min → 30 min
- Since real-time keeps data fresh while online, longer cache TTLs ensure offline works

### Files to modify
- `src/hooks/useFeed.ts` — add realtime subscription + cache read/write
- `src/hooks/usePosts.ts` — add realtime subscription
- `src/hooks/useStories.ts` — optimize realtime to avoid full refetch, add cache
- `src/hooks/useNotifications.ts` — add cache read/write
- `src/lib/asyncStorage.ts` — add stories/notifications cache helpers, increase TTLs

