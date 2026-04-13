

# Preload Critical Pages + Eager Loading for Key Routes

## What This Solves
Currently every page is lazy-loaded, meaning the JS chunk only downloads when you navigate to it — causing a visible delay. We'll eagerly preload the most important pages right after login, and prefetch others in the background.

## Approach

### 1. Eager-load core pages (no lazy for critical routes)
Stop lazy-loading the 5 most-used pages and import them directly:
- **Feed** — main landing page after login
- **MessagesPage** — real-time, needs to be instant
- **ProfilePage** — frequently visited
- **SearchPage** — quick access needed
- **BottomNavigation** — always visible

These will be bundled in the main chunk and available immediately with zero delay.

### 2. Prefetch remaining pages after auth resolves
Add a `usePagePrefetch` hook inside `AuthenticatedFeatures` that triggers `import()` calls for secondary pages (Reels, Bookmarks, Settings, Explore, etc.) after a short idle delay (~2 seconds). This downloads chunks in the background so they're cached by the time the user navigates.

### 3. React Query prefetching for messages data
In the `AuthenticatedFeatures` component, prefetch the chat list query so message data is already in the query cache when the user opens Messages.

## Technical Details

### Changes to `src/App.tsx`
- Convert Feed, MessagesPage, ProfilePage, SearchPage, BottomNavigation from `lazy()` to direct `import`
- Add a `usePagePrefetch` hook that runs `requestIdleCallback` or `setTimeout` to trigger `import()` on remaining lazy pages
- Prefetch chat list data via `queryClient.prefetchQuery`

### No other files change
This is purely a loading strategy change in App.tsx. No database changes, no new files, no removed files.

## Files to Edit
- `src/App.tsx` — eager imports for 5 core pages, idle-prefetch hook for the rest, query prefetch for messages

