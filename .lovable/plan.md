

# Offline-First with Outbox Queue (WhatsApp/Telegram Style)

## What Exists
- **Cache**: localStorage-based `CacheHelper` for feed, chats, messages, stories, notifications (30-min TTL)
- **Real-time**: Supabase subscriptions on messages, posts, stories, notifications
- **Optimistic messages**: `sendMessage` in `useMessages.ts` already adds messages instantly with `is_optimistic: true` and marks them `failed` on error
- **Network monitor**: `networkMonitor.ts` tracks online/offline and shows toasts
- **Problem**: When offline, actions (send message, like, post, react) just fail with error toasts. No queuing or retry.

## Plan: Add Offline Outbox Queue

### 1. Create `src/lib/offlineQueue.ts` — Central Outbox
- Store pending actions in localStorage as a queue: `postup_offline_queue`
- Each entry: `{ id, action, table, payload, createdAt, retryCount }`
- Actions: `insert`, `update`, `delete`, `upsert`
- Methods: `enqueue(action)`, `dequeue(id)`, `getAll()`, `flush()` 
- `flush()`: processes all queued items sequentially, removes on success, keeps on failure
- Max 3 retries per item, then mark as permanently failed

### 2. Create `src/hooks/useOfflineSync.ts` — Auto-Sync Hook
- Listen to `window.addEventListener('online', flush)`
- On mount: if online, flush any pending items from previous sessions
- Periodic retry every 30 seconds while online (for items that failed transiently)
- Mount this hook once in `App.tsx`

### 3. Update `src/hooks/useMessages.ts` — Queue Messages Offline
- In `sendMessage`: if `!navigator.onLine`, enqueue the insert action and keep the optimistic message with status `'queued'`
- Show a subtle "Waiting for connection" indicator instead of error toast
- On reconnect, `flush()` sends queued messages; real-time subscription picks up the confirmed message and replaces the optimistic one
- Same for `editMessage`, `deleteMessage` — queue if offline

### 4. Update `src/hooks/usePosts.ts` — Queue Posts/Reactions Offline
- Wrap post creation, reactions, and comments: if offline, queue and show optimistic UI
- On reconnect, flush sends them to Supabase

### 5. Update `src/hooks/useFeed.ts` — Never Expire Cache When Offline
- Remove cache TTL expiry when `!navigator.onLine` — always return cached data if offline
- Same for `getChats()`, `getMessages()`, `getStories()`, `getNotifications()` in `asyncStorage.ts`

### 6. Update `src/lib/asyncStorage.ts` — Offline-Aware Cache
- All `get*` methods: if `!navigator.onLine`, skip the TTL check and return whatever is cached
- This ensures the app always shows data when offline

### 7. Update `src/lib/networkMonitor.ts` — Trigger Flush on Reconnect
- Import and call `flushOfflineQueue()` in the `online` event handler

### Files
- **Create**: `src/lib/offlineQueue.ts`, `src/hooks/useOfflineSync.ts`
- **Edit**: `src/lib/asyncStorage.ts`, `src/lib/networkMonitor.ts`, `src/hooks/useMessages.ts`, `src/hooks/usePosts.ts`, `src/hooks/useFeed.ts`, `src/App.tsx`

### Message Status Flow
```text
User sends while offline:
  → optimistic message added (status: 'queued')
  → action saved to localStorage queue
  → no error toast shown

User comes back online:
  → networkMonitor fires 'online'
  → flushOfflineQueue() runs
  → each queued insert sent to Supabase
  → real-time subscription delivers confirmed message
  → optimistic message replaced with real one (status: 'sent')
```

