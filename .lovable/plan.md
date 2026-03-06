

# Style Chat Menu Popup & Fix Mobile Post Bar

## Two Issues

### 1. Chat Menu Dropdown — Make it Stylish
The current `DropdownMenuContent` in `ChatMenu.tsx` uses a plain `w-56` dropdown. Will enhance with:
- Wider menu with more padding and spacing between items
- Larger, colored icons for each action category
- Rounded menu items with hover effects
- Visual grouping with subtle section labels
- Scrollable on mobile so it doesn't overflow the screen

**File: `src/components/ChatMenu.tsx`**
- Add `max-h-[70vh] overflow-y-auto` to `DropdownMenuContent` for mobile scroll
- Add `py-2 px-1` padding to items for better touch targets
- Add color classes to icons (blue for info actions, amber for pin/star, red for destructive, purple for AI)
- Add section group labels like "Chat", "Settings", "Danger Zone" using `DropdownMenuLabel`

**File: `src/components/ui/dropdown-menu.tsx`**
- Update `DropdownMenuItem` to have `rounded-lg py-2.5 px-3` for larger, rounder touch targets
- Add `shadow-lg` and smoother border to `DropdownMenuContent`

### 2. FixedPostBar — Replace Textarea with Input
The `FixedPostBar` uses a multi-line `Textarea` which looks oversized on mobile. Replace with a single-line `Input` styled like a normal chat input bar (matching the message input style in `MessagesPage`).

**File: `src/components/FixedPostBar.tsx`**
- Replace `Textarea` with `Input`
- Use a simple rounded-full input like the chat message input
- Keep the send button compact and circular

