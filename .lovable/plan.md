

# Fix: Duplicate DMs + Page Ready on Load

## Problems

### 1. Duplicate Private Chats in Database
The database already has multiple duplicate private chats between the same user pairs (e.g., 5 chats between the same two users). The `createChat` function in `useChats.ts` has a duplicate-check loop, but it's fragile — race conditions or past bugs created duplicates that now show in the chat list (as seen in the screenshot with Zaytomuzz x3 and NORA x4).

### 2. Chat List Shows All Duplicates
`useMessages.ts` `fetchChats` loads every chat the user participates in without deduplicating. For private chats with the same other user, it should only show the most recent one.

### 3. Page Not Ready on Load
The `useMessages` hook starts fetching immediately but the `user` from `useAuth` may not be resolved yet, causing a brief flash or empty state.

## Plan

### Step 1: Database Cleanup — Remove Duplicate Chats
Write a migration that:
- For each pair of users with multiple private chats, keeps only the one with the most recent message (or the newest chat if no messages), and deletes the rest
- Adds a unique constraint or uses a DB function to prevent future duplicates

```sql
-- Delete duplicate private chats, keeping the one with the latest activity
WITH ranked AS (
  SELECT cp1.chat_id,
    cp1.user_id AS u1, cp2.user_id AS u2,
    LEAST(cp1.user_id, cp2.user_id) AS user_a,
    GREATEST(cp1.user_id, cp2.user_id) AS user_b,
    ROW_NUMBER() OVER (
      PARTITION BY LEAST(cp1.user_id, cp2.user_id), GREATEST(cp1.user_id, cp2.user_id)
      ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
    ) AS rn
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id AND cp1.user_id < cp2.user_id
  JOIN chats c ON c.id = cp1.chat_id AND c.type = 'private'
)
DELETE FROM chats WHERE id IN (SELECT chat_id FROM ranked WHERE rn > 1);
```

### Step 2: Add DB Function to Prevent Future Duplicates
Create a trigger function on `chats` insert that checks if a private chat already exists between the same two users before allowing creation. Or better: add the check in `createChat` more robustly using a single SQL query instead of the N+1 loop.

### Step 3: Fix `createChat` in `useChats.ts`
Replace the N+1 loop with a single efficient query:
```typescript
// Single query to find existing private chat with this user
const { data: existing } = await supabase.rpc('find_private_chat', {
  user_a: user.id,
  user_b: participantUuid
});
```
Or use a simpler approach with a raw query joining `chat_participants` twice.

### Step 4: Deduplicate in `useMessages.ts` `fetchChats`
As a safety net, after fetching all chats, deduplicate private chats by the other participant's user_id — keep only the most recently updated one.

### Step 5: Ensure Page Loads Ready
Gate the chat fetching on `user` being fully resolved (already done via `if (user)` checks). Add a loading state that shows a skeleton while auth resolves, so the page appears "ready" immediately with content populating smoothly.

## Files to Change
- **Database migration**: Clean up existing duplicates + create `find_private_chat` RPC function
- **`src/hooks/useChats.ts`**: Replace N+1 duplicate check with single query using `find_private_chat` RPC
- **`src/hooks/useMessages.ts`**: Add deduplication filter for private chats in `fetchChats`, ensure loading skeleton renders while auth resolves
- **`src/pages/MessagesPage.tsx`**: Ensure skeleton/loading state shows immediately while data loads (page "ready on init")

## No Existing Files Removed or Renamed
All changes are additive fixes within existing files.

