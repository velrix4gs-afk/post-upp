

# Fix: Excessive Space Below Input Bar in Chat

## Problem
The screenshot shows a large gray gap between the message input bar and the keyboard. This is caused by `pb-[env(safe-area-inset-bottom)]` on line 826 of `MessagesPage.tsx`. On devices with safe area insets (or when the keyboard is open), this adds unnecessary padding that creates the visible gap. The `h-[100dvh]` on the outer container (line 416) should already handle viewport sizing correctly with the keyboard.

## Fix

### `src/pages/MessagesPage.tsx`
- **Line 826**: Change `pb-[env(safe-area-inset-bottom)]` to `pb-safe` or remove it entirely. When the keyboard is open, the dynamic viewport (`100dvh`) already accounts for the keyboard — adding safe-area padding on top of that creates the double gap.
- Replace with: `bg-card z-10 flex-shrink-0` (no bottom padding). If safe area is needed for when the keyboard is closed, use a minimal approach: `pb-[max(0.25rem,env(safe-area-inset-bottom))]` to ensure a small baseline but not excessive space.

This is a one-line CSS class change — no structural modifications needed.

## File to Edit
- `src/pages/MessagesPage.tsx` — remove `pb-[env(safe-area-inset-bottom)]` from the input section container on line 826

