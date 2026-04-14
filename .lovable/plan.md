

# Fix Mobile Messaging Issues

## 3 Problems to Fix

### 1. Text Input Bar Not Aligned on Mobile
Line 810: The input section uses `fixed inset-x-0 bottom-0` with `md:ml-[320px]`. On mobile, `fixed inset-x-0` stretches full width which is correct, but the input bar's form has `rounded-full` on line 886 which may cause visual misalignment. The real issue is the input container lacks left/right padding consistency on mobile. Will ensure the fixed input bar spans correctly without sidebar offset on mobile.

### 2. Popup Not Dismissing on Outside Tap
The `ProfileHoverCard` uses a Radix `Dialog` with `DialogContent` set to `bg-transparent shadow-none max-w-fit`. The problem: Radix Dialog content receives pointer events across its full bounding box. Since the content has `max-w-fit`, tapping outside the visible `MiniProfilePopup` card but inside the dialog content area doesn't trigger the overlay dismiss. Fix: add `onInteractOutside` handler to close, and ensure the DialogContent doesn't consume clicks on transparent areas by using `pointer-events-none` on the wrapper with `pointer-events-auto` on the inner card.

### 3. Random Border Box at Bottom of Messages Page
The `Card` on line 403 has `border-0 md:border` — this should be working. The likely culprit is the chat area wrapper `div` on line 1001 that closes, or some inner element producing a visible border on mobile. Looking at the structure: on mobile when no chat is selected, the chat list shows and the right panel is hidden. But if the `Card` still has residual border styles from `bg-gradient-to-br` or child elements, it could create a visible box. Will audit and ensure no child borders leak on mobile.

## Changes

### File: `src/components/ProfileHoverCard.tsx`
- Add `onInteractOutside` to `DialogContent` to call `setOpen(false)` — ensures tapping the overlay always dismisses
- Set `DialogContent` to `pointer-events-none` wrapper, with `MiniProfilePopup` wrapped in a `pointer-events-auto` div so only the visible card captures events

### File: `src/pages/MessagesPage.tsx`
- **Input bar alignment**: Change the fixed input container (line 810) from `fixed inset-x-0 bottom-0` to use proper mobile-scoped styling. Remove `md:auto md:auto` (duplicated/meaningless). Ensure the input section uses `left-0 right-0 bottom-0` on mobile and respects the sidebar offset only on `md:` screens
- **Border box**: Add `shadow-none` to the Card on mobile and ensure no gradient border leaks. Check the inner flex container for any border-bottom on mobile
- Remove any remaining visual artifacts from the card edges on small screens

## Files to Edit
- `src/components/ProfileHoverCard.tsx` — fix tap-outside dismiss
- `src/pages/MessagesPage.tsx` — fix input alignment + border box on mobile

