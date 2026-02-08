

# Redesign Bottom Navigation Bar (Matching Reference Image)

## What Changes

### 1. Full-width translucent bar pinned 5px from the bottom
- Change from centered floating icons to a full-width rounded bar sitting 5px above the bottom edge of the screen
- Add a translucent background using `bg-background/80 backdrop-blur-lg` so content behind it shows through slightly
- Add rounded corners (`rounded-2xl`) and slight horizontal margin (`mx-3`) to give the pill/capsule shape from the reference image

### 2. Add text labels under each icon
- Each nav item becomes a vertical stack: icon on top, small label text ("Home", "Search", "Create", "Reels", "Profile") below
- Labels use `text-[10px]` for a clean, compact look

### 3. Active tab pill highlight
- The active tab gets a subtle rounded pill background highlight (e.g., `bg-primary/15 rounded-xl`) wrapping the icon and label together, similar to the green highlight in the reference image
- Active icon and label use the primary color

### 4. Create button styling
- Keep the circular primary-colored icon but sized to match the row, with a "Create" label underneath like the other items

### 5. Keep auto-hide behavior
- All auto-hide logic (3-second timer, scroll/touch listeners, fade animation) stays exactly as-is
- The bar fades in/out the same way it does now

### 6. Keep all existing functionality
- Same 5 nav items, same paths, same Create drawer, same page visibility rules, same auth checks

## Technical Details

**Single file changed:** `src/components/BottomNavigation.tsx`

**Nav container changes:**
- From: `left-1/2 -translate-x-1/2 bottom-6` (centered, no background)
- To: `left-0 right-0 bottom-[5px] mx-3 rounded-2xl bg-background/80 backdrop-blur-lg border border-border/30` (full-width with margin, translucent, 5px from bottom)

**Item layout changes:**
- From: `flex items-center gap-4` (horizontal icons only)
- To: `flex justify-around items-center h-16 px-2` (evenly spaced, taller for labels)
- Each item: `flex flex-col items-center gap-0.5` with icon + `<span className="text-[10px]">Label</span>`

**Active state:**
- Wrap active item content in a pill: `bg-primary/15 rounded-xl px-3 py-1`

**What stays the same:**
- `isVisible`, `lastInteraction`, `handleInteraction`, auto-hide timer, event listeners
- `allowedPages`, `isAuthPage` checks
- All nav item definitions (paths, actions, icons)
- Create Post Drawer

