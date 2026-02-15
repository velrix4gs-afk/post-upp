
# Fix Messages Page: 4 Issues

## Issue 1: Page sometimes doesn't open
**Root cause**: The `MessagesPage` wraps everything in `<Navigation />` plus a `<Card>` with `h-screen` inside a `min-h-screen` container. The lazy-loaded page may fail silently if the `useMessages` or `useFriends` hooks error out during fetch, leaving the page blank. Additionally, `h-screen` nested inside another full-height container can cause overflow issues on mobile WebView.

**Fix**: Wrap the main content in an error boundary with a retry button, and fix the height calculation to use `h-[100dvh]` (dynamic viewport height) instead of `h-screen` which is unreliable in WebViews. Add a loading state fallback so the page always renders something.

**File**: `src/pages/MessagesPage.tsx`

## Issue 2: No back navigation
**Root cause**: The "Messages" header (line 357) has no back button. When viewing the chat list on mobile, there is no way to navigate back to the feed. The `BackNavigation` component is imported but only used inside the chat view, not on the chat list view.

**Fix**: Add a back arrow button next to the "Messages" title in the chat list header that navigates back using `navigate(-1)` or to `/feed`. This only needs to show on mobile since desktop has the sidebar always visible.

**File**: `src/pages/MessagesPage.tsx`

## Issue 3: Non-friends showing in DMs
**Root cause**: Lines 436-467 in `MessagesPage.tsx` display ALL entries from `useFriends()` (the `friends` array) who don't have an existing chat. The `useFriends` hook fetches from the `friendships` edge function, and these users are shown as quick-start chat suggestions directly in the chat list. However, the issue states users who are NOT friends are appearing. This happens because existing chats (loaded by `useMessages`) show ALL chats the user is a participant in -- there is no filtering by friendship status. So if a chat was created before the friendship check was added, or if someone somehow bypassed it, those chats persist.

**Fix**: 
- Remove the inline friends suggestions from the chat list (lines 436-467). The `NewChatDialog` (+ button) already properly filters to mutual followers and is the correct way to start new chats.
- This eliminates the visual clutter of showing friend avatars directly in the chat list and ensures the only way to start new chats is through the dialog which has proper mutual-follow validation.

**File**: `src/pages/MessagesPage.tsx`

## Issue 4: Empty space at bottom
**Root cause**: The page uses `min-h-screen` on the outer div and `h-screen` on `<main>`, but `<Navigation />` takes up space at the top, pushing content down. The Card inside tries to fill `h-full` but the actual available height is less than the screen, leaving empty space at the bottom. On mobile WebView, browser chrome further reduces available space.

**Fix**: Change the layout to use `h-[100dvh]` with `flex flex-col` on the outer container, and make `<main>` use `flex-1 overflow-hidden` instead of `h-screen`. This ensures the Card fills exactly the remaining space after the Navigation header, with no empty gap.

**File**: `src/pages/MessagesPage.tsx`

## Technical Summary

All changes are in a single file: `src/pages/MessagesPage.tsx`

1. **Outer container**: Change from `min-h-screen` to `h-[100dvh] flex flex-col overflow-hidden`
2. **Main element**: Change from `h-screen` to `flex-1 overflow-hidden`
3. **Back button**: Add `ArrowLeft` icon button next to "Messages" title, visible on mobile, navigates back
4. **Remove friend suggestions block**: Delete lines 436-467 (the inline friends list in the sidebar) -- the `+` button / `NewChatDialog` already handles this correctly with proper mutual-follow filtering
5. **Import cleanup**: Add `ArrowLeft` to the lucide import if not already present
