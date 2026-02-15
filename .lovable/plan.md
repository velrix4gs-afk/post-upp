

# Restyle Chat List Items to Match Reference Design

## What the reference image shows
- Large circular profile avatar on the left with a subtle ring/border
- User's display name (or nickname) prominently on the first line
- Last message preview below the name, prefixed with a checkmark icon (indicating sent/read status)
- Timestamp right-aligned on the same row as the name
- Clean dark background with good spacing

## Current state
The chat list items (lines 497-542 in `MessagesPage.tsx`) already have a similar structure but with minor differences:
- The username handle (`@username`) is shown inline next to the display name -- this should move to below or be removed from the name row to keep it clean like the reference
- No read/sent checkmark indicator before the last message snippet
- Timestamp is already right-aligned on the name row (this is correct)

## Changes

### File: `src/pages/MessagesPage.tsx`

**1. Clean up the name row**
- Show only the display name (or nickname) on the first line, without the `@username` handle inline
- Keep the timestamp right-aligned on this same row (already correct)

**2. Add a checkmark before the last message**
- Add a `Check` icon (from lucide-react) before the last message snippet to indicate sent status
- Only show checkmark for messages sent by the current user
- Style: small muted icon, similar to the reference

**3. Increase avatar ring visibility**
- Add a subtle border/ring around the avatar to match the reference image's circular frame effect (a thin `ring-2 ring-border/50` or similar)

**4. Adjust spacing and sizing**
- Ensure the avatar is `h-12 w-12` (already correct)
- Slightly increase padding if needed for a more spacious feel

## What stays the same
- All click handlers and navigation logic
- Online indicator dot
- Chat filtering and search
- AI Assistant chat item at top
- The overall flex layout structure
- All hooks and data fetching

