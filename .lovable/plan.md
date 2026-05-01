# Fix: Messages page flickering + extra bottom border

## Root cause of the flicker (confirmed from console logs)

The console shows `get_chat_list` being called dozens of times per second. This is a classic React infinite-render loop, caused by **`MessagesPage.tsx` lines 145–152**:

```tsx
useEffect(() => {
  if (user) {
    refetchChats();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}, [user, refetchChats]);
```

`refetchChats` comes from `useMessages` (line 871 of `useMessages.ts`) and is a **plain inline function** that gets a new reference on every render. So:

1. Effect runs → calls `refetchChats()`
2. `fetchChats` resolves → `setChats(...)` → re-render
3. New `refetchChats` reference → effect runs again
4. Loop forever → flicker, never settles, list never stably renders

`useMessages` already does its own initial fetch in its own `useEffect([user])` (line 102), so this extra effect in the page is **redundant** anyway.

## Fix #1 — Remove the redundant effect (one-line block delete)

In `src/pages/MessagesPage.tsx` lines 144–152, delete the whole `// Initial fetch & notifications` effect. The hook already fetches on mount when `user` becomes available. Move the notification permission request into a separate effect with an empty dep array so it runs once:

```tsx
// Request notification permission once on mount
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

That alone stops the loop.

## Fix #2 — Bottom border / extra space

The "extra border at the bottom" is the bottom border on the **last `ChatListItem`**. Every `ChatListItem` row applies `border-b border-border/30` (see `src/components/messaging/ChatListItem.tsx` line ~145), so the final row in the list shows a hairline border with no row beneath it. Combined with `BottomNavigation` floating above, it reads as a stray line.

Fix by making the row's bottom border conditional via Tailwind's `last:border-b-0` utility:

```tsx
// ChatListItem.tsx — in the className for the swiping row div
'border-b border-border/30 last:border-b-0'
```

This removes the trailing border on the final item without changing any other behavior.

## Files to edit

- `src/pages/MessagesPage.tsx` — replace lines 144–152 (remove `refetchChats` from deps; split notification permission into its own one-shot effect).
- `src/components/messaging/ChatListItem.tsx` — append `last:border-b-0` to the row's className list.

## What stays intact

- All Supabase calls, RPCs, realtime subscriptions
- The `useMessages` hook itself (no changes there)
- All chat features, dialogs, animations, layout
- No DB schema changes
- No UUIDs touched
