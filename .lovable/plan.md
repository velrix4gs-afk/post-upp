# Fix Message Deletion & Enhance Chat Features

## Analysis Summary

After thorough review, **most requested features already exist** in the codebase (ChatMenu.tsx has nickname, shared media, mute, export, report, pin, theme, AI summary, clear chat, unblock, view profile). The key issues to fix are:

## Changes Required

### 1. Fix Message Deletion (double dialog bug)

**File: `src/pages/MessagesPage.tsx**`

- The `EnhancedMessageBubble` already has its own delete confirmation dialog with "Delete for me" / "Delete for everyone" options
- But `MessagesPage` passes `onDelete={(id) => setDeletingMessageId(id)}` which only captures the id, then shows a SECOND redundant dialog
- **Fix**: Change the `onDelete` prop to directly call `deleteMessage(id, deleteFor)` — remove the `deletingMessageId` state, the outer `AlertDialog` (lines 988-1001), and `handleDeleteMessage`

### 2. Auto-scroll to Latest Unread

**File: `src/pages/MessagesPage.tsx**`

- Currently `scrollToBottom()` runs on every message change, forcing users to the bottom
- **Fix**: On initial chat load, find the first unread message (message not sent by current user with status !== 'read') and scroll to it. On subsequent new messages, only auto-scroll if user is already near the bottom (within 200px).

### 3. Pinned Chats Sort to Top

**File: `src/pages/MessagesPage.tsx**`

- `filteredChats` doesn't account for pinned status from `useChatSettings`
- **Fix**: Fetch pinned chat IDs and sort `filteredChats` so pinned chats appear first in the list. Add a small pin icon indicator on pinned chats.

### 4. Fix `onDelete` Prop Type Mismatch

**File: `src/pages/MessagesPage.tsx**`  

- Currently: `onDelete={isOwn ? (id) => setDeletingMessageId(id) : undefined}`
- Should be: `onDelete={(id, deleteFor) => deleteMessage(id, deleteFor)}` for all messages (not just own — "delete for me" should work for everyone's messages)
- The `isOwn` check should only control whether "delete for everyone" appears, which `EnhancedMessageBubble` already handles internally

## What Is There but Dosent work (A lot of  Changes Needed according to what they do)

- Add Nickname (ChatMenu dialog)
- View Shared Media (ChatMenu → ChatMediaTab)
- Mute/Unmute Notifications (ChatMenu with duration picker)
- Export Chat as text (ChatMenu)
- Report User with backend logging (ReportUserDialog → `reported_users` table)
- Pin Chat / Add to Favorites (ChatMenu → useChatSettings)
- Change Chat Theme/Color (ChatMenu theme dialog)
- AI Summary (ChatMenu, premium gated)
- Clear Chat history (ClearChatDialog — soft delete via `deleted_for`)
- Unblock/Reconnect (ChatMenu checks `useBlockedUsers`)
- Tap username → View Profile (chat header onClick → navigate to profile)
- Chat wallpaper (WallpaperDialog)
- File sharing with inline display (ChatAttachmentsSheet + media rendering in bubble)
- Group info page (GroupInfoDialog)
- Voice message recording + inline playback (VoiceRecorder + VoiceMessagePlayer)
- Message reactions visible both sides (useMessageReactions + MessageReactions component with realtime subscription)
- New message notifications (toast + browser Notification in useMessages realtime handler)