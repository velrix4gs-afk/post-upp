

# Fix: Popup Dismissal + Reply Button on Every Comment

## Issues Found

### 1. Popup Won't Dismiss on Outside Tap
The `ProfileHoverCard` wrapper has `className="touch-none select-none"` (line 69). The `touch-none` CSS class disables all touch interactions on that element and its children, which can interfere with the Dialog overlay's tap-to-dismiss behavior. Additionally, the Radix Dialog overlay already handles outside clicks natively — the issue is the `touch-none` blocking touch events from reaching the overlay.

**Fix in `ProfileHoverCard.tsx`:**
- Remove `touch-none` from the wrapper class
- Instead, use `touch-manipulation` which still works for long-press detection but doesn't block all touch events
- This lets the Dialog overlay receive taps properly so clicking/tapping anywhere outside the popup dismisses it

### 2. Reply Button Missing on Deep Comments
Currently in `ThreadedComment.tsx` line 112: `{depth < maxDepth && (` — the Reply button only shows when depth is less than 3. Comments at depth 3+ have no Reply button.

**Fix in `ThreadedComment.tsx`:**
- Remove the `depth < maxDepth` condition so Reply appears on every comment
- Keep `maxDepth` only for visual nesting (indent limit) — replies beyond depth 3 still get created but render at max indent level instead of nesting further

## Files to Edit
- `src/components/ProfileHoverCard.tsx` — replace `touch-none` with `touch-manipulation`
- `src/components/ThreadedComment.tsx` — remove depth restriction on Reply button, keep max indent for display only

