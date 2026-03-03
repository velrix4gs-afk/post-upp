

# Fix: Chat Menu Items All Navigate to Profile Instead of Their Actions

## Root Cause
The chat header container (line 618-626 in `MessagesPage.tsx`) has an `onClick` handler that navigates to the user's profile:
```
onClick={() => navigate(`/profile/${otherParticipant.user_id}`)}
```

The phone, video, and back buttons inside it call `e.stopPropagation()` to prevent this. However, the `ChatMenu` component does NOT stop propagation — so when any dropdown menu item is clicked, the click event bubbles up to the header div and navigates to the profile page, overriding the actual menu action.

## Fix

### File: `src/components/ChatMenu.tsx`
- Wrap the `DropdownMenuTrigger` button's `onClick` with `e.stopPropagation()` to prevent the header's profile navigation from firing when the menu trigger is clicked
- Also add `onClick={(e) => e.stopPropagation()}` on the `DropdownMenuContent` so that clicking any menu item doesn't bubble up to the header

### File: `src/pages/MessagesPage.tsx`
- No changes needed — the header's onClick behavior (tap username → view profile) is correct and should remain. The fix is entirely in ChatMenu preventing propagation.

## What This Fixes
All menu items will now correctly execute their own actions:
- Add Nickname → opens nickname dialog
- View Shared Media → opens media tab
- Search in Chat → opens search dialog
- Starred Messages → opens starred dialog
- Shared Links → opens links dialog
- Change Theme → opens theme picker
- Change Wallpaper → opens wallpaper dialog
- Disappearing Messages → opens disappearing dialog
- Pin Chat → toggles pin via useChatSettings
- Add to Favorites → toggles pin
- Mute Chat → opens mute duration dialog
- AI Summary → shows toast summary
- Export Chat → downloads chat as text
- Clear Chat → opens clear dialog
- Block/Unblock User → opens block dialog or unblocks
- Report User → opens report dialog

