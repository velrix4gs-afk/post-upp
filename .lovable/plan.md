

# Rebuild Messages & In-Chat Pages — WhatsApp/Google Messages Style

## Vision
Full rebuild of `MessagesPage.tsx` into two polished surfaces with Apple-grade spring animations already wired in (`message-send`, `message-receive`, `bubble-pop`, `scale-in`, `slide-in-right`, `fade-up`).

---

## Part 1 — Messages List (WhatsApp style)

**Layout** (mobile-first, `h-[100dvh]`, single full box):
- **Header**: Large "Chats" title, search icon, new chat icon, overflow menu (3-dot). Subtle scroll-shrink effect.
- **Search bar**: Pill-shaped, appears below header. Tapping expands with `slide-up`.
- **Filter chips**: All · Unread · Favorites · Groups (horizontal scroll, `tap-scale`).
- **Pinned section**: Pinned chats at top with 📌 indicator, subtle background tint.
- **Chat rows**:
  - Avatar (with online dot), name, last message preview, timestamp
  - Unread badge (green WhatsApp-style), muted icon, pin icon, read receipt on last message
  - Swipe-left → Archive / Mute / Delete actions (touch gesture)
  - Long-press → action sheet (Pin, Mute, Mark unread, Delete, Block)
  - `animate-stagger` entrance, `tap-scale` on press, smooth selection highlight

**FAB**: Floating "New chat" button bottom-right with `bubble-pop` on mount.

---

## Part 2 — In-Chat View (Google Messages + WhatsApp hybrid)

**Header** (sticky, compact):
- Back arrow, avatar, name + online/typing status, voice call, video call, 3-dot menu
- 3-dot menu: View contact, Media/links/docs, Search, Mute, Wallpaper, More (Block, Report, Clear chat, Export)
- Tap header → opens Contact Info sheet (slide-up)

**Pinned message banner**: Below header if any message is pinned (tap to scroll to it, `fade-up` entrance).

**Messages area**:
- Date separators (centered pills, `fade-up`)
- Bubbles use existing `EnhancedMessageBubble` with all animations already in place
- WhatsApp-style chat wallpaper (subtle pattern, theme-aware)
- Auto-scroll to bottom on new message; "scroll to bottom" FAB appears when scrolled up
- Smart grouping: consecutive messages from same sender get tighter spacing, only last shows tail
- Typing indicator: 3 animated dots in a bubble with `bubble-pop`

**Reply preview bar**: Above input when replying, `slide-up` in/out with close button.

**Input bar**:
- Attach (+) icon → bottom sheet (Camera, Gallery, Document, Location, Contact, Poll)
- Expanding text area (1-5 lines, smooth height transition)
- Emoji button
- Mic button when empty → swaps to Send button (`scale-in`) when typing
- Voice recording: hold mic → red recording UI with waveform & slide-to-cancel

**Features wired**:
- ✅ Pin message (already in dropdown — wire to pinned banner)
- ✅ Star, Forward, Reply, Edit, Delete, Copy, Report (already exist)
- ✅ Read receipts (✓ ✓✓ blue) inline
- ✅ Reactions (long-press / picker)
- ✅ Swipe-right on bubble → quick reply
- ✅ Disappearing messages indicator
- ✅ Encryption badge on first load

---

## Animations Applied
- Chat list rows: `animate-stagger` on mount, `tap-scale` on press
- Chat selection: `slide-in-right` on mobile when opening a chat
- Header buttons: `tap-scale`
- FAB: `bubble-pop` mount, `tap-scale` press
- Pinned banner: `fade-up`
- Date separators: `fade-up`
- Reply preview: `slide-up`
- Send button swap: `scale-in`
- Action sheets: existing dialog spring transitions
- Scroll-to-bottom FAB: `scale-in` / `scale-out`

---

## Files to Edit
- **`src/pages/MessagesPage.tsx`** — full rebuild (list view + chat view, two-column on desktop, single-view stack on mobile)
- **`src/components/messaging/ChatListItem.tsx`** *(new)* — WhatsApp-style row with swipe actions
- **`src/components/messaging/ChatHeader.tsx`** *(new)* — sticky in-chat header with menu
- **`src/components/messaging/ChatInput.tsx`** *(new)* — expanding input with mic↔send swap
- **`src/components/messaging/PinnedMessageBanner.tsx`** *(new)* — pinned banner
- **`src/components/messaging/ScrollToBottomFab.tsx`** *(new)* — floating scroll FAB
- **`src/components/messaging/DateSeparator.tsx`** *(new)* — centered date pills
- **`src/index.css`** — chat wallpaper pattern utility, swipe-action transitions

## What Stays Intact
- All Supabase calls (`useMessages`, `useChats`, `useRealtimeChat`, `useTypingIndicator`)
- `EnhancedMessageBubble` (already animated)
- All existing dialogs (Forward, Star, Wallpaper, GroupInfo, etc.)
- Read receipt logic, profile cache, message tracking refs
- No DB schema changes

