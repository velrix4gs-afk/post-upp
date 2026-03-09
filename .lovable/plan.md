

# Top Comment Preview + Enhanced Reply UX

## What's Needed

### 1. "Most Relevant" Comment Preview Under Posts (Facebook-style)
Currently, comments only appear when you click "Comment" to expand. Facebook shows the top comment (highest likes) directly under the post stats, before you expand all comments.

**Changes to `PostCardModern.tsx`:**
- Add a new `useTopComment` hook (or inline fetch) that fetches the single top comment (by `likes_count DESC`) for the post
- Display it between the engagement stats and the action buttons — a compact preview showing avatar, name, comment text, like count
- Clicking it or "View more comments" expands full `ThreadedCommentsSection`
- If no comments exist, show nothing

**New hook `useTopComment.ts`:**
- Simple hook: given a `postId`, fetch the single root comment (`parent_id IS NULL`) with highest `likes_count`, joined with profile data
- Lightweight — only 1 row fetched per post

### 2. Instagram-style Reply Improvements
**Changes to `ThreadedComment.tsx`:**
- When replying, auto-prepend `@username` mention in the reply text
- Show reply count on comments (e.g., "View 3 replies") with collapse/expand toggle instead of always showing all replies
- Pass correct `isLiked` per-reply (currently passes parent's `isLiked` to all children — this is a bug on line 158)

**Changes to `ThreadedCommentsSection.tsx`:**
- Sort root comments by `likes_count DESC` (most relevant first), matching Facebook behavior
- Add "Most relevant" label at the top

**Changes to `useThreadedComments.ts`:**
- Fix the comment sorting to be by `likes_count DESC` for root comments (currently `created_at ASC`)
- Replies under each comment stay chronological

### 3. Fix `isLiked` Bug in Replies
Line 158 of `ThreadedComment.tsx` passes the parent's `isLiked` prop to all children instead of checking each reply's like status individually. Fix: pass `isCommentLiked` function down and call it per reply.

## Files to Create
- `src/hooks/useTopComment.ts` — fetch single most-liked comment for a post

## Files to Edit
- `src/components/PostCard/PostCardModern.tsx` — add top comment preview between stats and action buttons
- `src/components/ThreadedComment.tsx` — collapsible replies, @mention on reply, fix isLiked propagation
- `src/components/ThreadedCommentsSection.tsx` — sort by relevance, pass `isCommentLiked` function
- `src/hooks/useThreadedComments.ts` — sort root comments by likes_count DESC

## No Database Changes Needed
The `comments` table already has `parent_id` and `likes_count` columns.

