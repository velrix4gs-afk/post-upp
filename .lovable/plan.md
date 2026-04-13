

# Messaging System Cleanup

## Problems Found

### 1. Chat list never shows last message previews
`MessagesPage.tsx` line 526 tries to get last messages from the `messages` state — but that array only contains messages for the **currently selected chat**. Every other chat in the list shows "Tap to chat" instead of an actual message preview. This is the biggest UX issue.

### 2. N+1 query waterfall in `fetchChats` (useMessages.ts)
For each chat, the code fetches participants individually, then for each participant fetches their profile individually. With 10 chats averaging 2 participants each, that's ~30 sequential DB calls just to load the chat list.

### 3. Input bar broken on mobile
Line 816: `className="fixed inset-x-0 bottom-0 ... ml-[320px]"` — the `ml-[320px]` pushes the input bar off-screen on mobile where the sidebar is hidden. Should only apply on `md:` breakpoint.

### 4. Duplicate `messagesEndRef` divs
Lines 810 and 812 both render `<div ref={messagesEndRef} />`, causing scroll-to-bottom to target the wrong element.

### 5. Two competing chat hooks
`useChats.ts` and `useMessages.ts` both independently fetch the chat list with different data shapes, causing confusion and redundant network calls.

## Plan

### Step 1: Add last message to chat list query
In `useMessages.ts` `fetchChats`, after fetching chats, batch-fetch the latest message per chat in a single query (select from `messages` with distinct on `chat_id` ordered by `created_at desc`). Store last messages in a Map and attach to each chat object. This gives chat list items real previews.

### Step 2: Optimize fetchChats — eliminate N+1
Replace the per-chat participant + per-participant profile loop with a single batch query:
- Fetch all `chat_participants` for all `chatIds` in one call
- Fetch all unique user profiles in one call
- Join them in memory

This reduces ~30 queries to 3.

### Step 3: Fix input bar mobile positioning
Change `ml-[320px]` to `md:ml-[320px]` so the input spans full width on mobile.

### Step 4: Remove duplicate messagesEndRef
Delete the extra `<div ref={messagesEndRef} />` on line 812.

### Step 5: Remove `useChats` from MessagesPage
`useMessages` already handles chat listing. The only thing `useChats` is used for in `MessagesPage` is `createChat`. Move `createChat` logic into `useMessages` or import it standalone, and stop double-fetching.

## Files to Change
- **`src/hooks/useMessages.ts`** — add last_message field to Chat, batch-optimize fetchChats, add createChat
- **`src/pages/MessagesPage.tsx`** — fix input ml, remove duplicate ref, remove useChats import, use last_message for previews

