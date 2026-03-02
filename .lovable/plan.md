# Fix Build Errors & Ensure Complete Message Deletion

## Problem

The build errors are in `src/hooks/usePolls.ts` — the Supabase generated types don't include `polls`, `poll_options`, or `poll_votes` tables, causing TypeScript failures. This is unrelated to the user's chat request but blocks the build because we deleted it and dont need it any more so lets move on and ignore it.

The user also wants deleted messages to be **completely cleared** (not soft-deleted). The current `deleteMessage` in `useMessages.ts` already handles "delete for everyone" with a hard `DELETE`, and "delete for me" with a soft `deleted_for` array — both already remove from local state. The issue is that the user wants ALL deletions to fully remove the message, not just hide it.

Most chat features listed (nickname, shared media, mute, export, report, pin, theme, AI summary, clear chat, unblock, wallpaper, reactions, voice messages, file sharing, group info) **already exist** in the codebase as confirmed in previous analysis. The plan focuses on what's actually broken.

## Changes

### 1. Dont Fix `usePolls.ts` build errors Remove it finally to make everything work

Cast `supabase` to `any` for the `.from('polls')`, `.from('poll_options')`, and `.from('poll_votes')` calls since these tables exist in the database but aren't in the generated types file. This is the standard workaround when types are out of sync.

### 2. Update `deleteMessage` to always hard-delete

In `src/hooks/useMessages.ts`, change the "delete for me" branch to also perform a hard `DELETE` from the database instead of the soft `deleted_for` approach. Both options ("delete for me" and "delete for everyone") will now fully remove the row. The message disappears from both local state and the database completely.

### File changes

- `src/hooks/usePolls.ts` — cast `supabase` to `any` for poll table queries (6 locations)
- `src/hooks/useMessages.ts` — simplify `deleteMessage` to always hard-delete the row regardless of `deleteFor` parameter
- And all that needs to be fixed from the list and that is not working or does something else 
- Check (nickname, shared media, mute, export, report, pin, theme, AI summary, clear chat, unblock, wallpaper, reactions, voice messages, file sharing, group info) to make sure their buttons do what they are meant to