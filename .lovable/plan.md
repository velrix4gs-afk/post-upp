

# Apple-Grade Message Animations

## What We're Adding

1. **Message send animation** — New messages slide up and fade in from the bottom (like iMessage). Own messages slide from the right, received messages from the left.
2. **Smooth transitions throughout** — Chat view transitions, typing indicator fade, reaction pop, image viewer transitions.

## Implementation

### File 1: `tailwind.config.ts` — Add keyframes

Add these keyframes to the existing `keyframes` object:

- **`message-send`**: `translateY(20px) + opacity 0` → `translateY(0) + opacity 1` with a slight `scale(0.95)` → `scale(1)` — mimics the iMessage bubble "pop up" feel
- **`message-receive`**: Same but slides from left side
- **`bubble-pop`**: Quick scale overshoot `0.95 → 1.02 → 1` for a springy Apple feel
- **`fade-up`**: Generic subtle fade+slide for date separators and system messages

Add corresponding `animation` entries with cubic-bezier easing (`cubic-bezier(0.175, 0.885, 0.32, 1.275)` — spring curve).

### File 2: `src/components/EnhancedMessageBubble.tsx` — Apply send animation

- Add a new optional prop `isNew?: boolean` to mark freshly sent/received messages
- When `isNew` is true, apply `animate-message-send` (own) or `animate-message-receive` (received) to the outer container div (line 148)
- Add `transition-all duration-200` to the bubble div for hover/interaction smoothness
- Add subtle scale on the action buttons appearing: `transition-all duration-150` on the hover menu

### File 3: `src/pages/MessagesPage.tsx` — Track new messages + pass `isNew`

- Add a `newMessageIds` ref (Set) that tracks message IDs added since last render
- When messages array changes, compare with previous to find new IDs
- Pass `isNew={newMessageIds.current.has(message.id)}` to `EnhancedMessageBubble`
- Clear the set after a short timeout (400ms) so animation only plays once
- Add `transition-colors duration-200` to chat list items for smooth selection highlight
- Add smooth scroll behavior to the messages container

### File 4: `src/index.css` — Global smooth transitions

- Add `scroll-behavior: smooth` to the messages scroll container class
- Add transition utilities for the chat page elements

## Animation Specs (Apple-grade)
- **Duration**: 280ms for message bubbles (fast but visible)
- **Easing**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — spring overshoot like iOS
- **Send bubble**: slides up 20px + fades in + slight scale from 0.96
- **Receive bubble**: slides up 15px + fades in
- **Fill mode**: `forwards` so animation state persists

## Files to Edit
- `tailwind.config.ts` — new keyframes + animation definitions
- `src/components/EnhancedMessageBubble.tsx` — add `isNew` prop, apply animation classes
- `src/pages/MessagesPage.tsx` — track new messages, pass `isNew`, smooth transitions

