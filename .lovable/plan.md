

# Fix: Broken Feed + Comment System Issues

## Root Cause Found
The `useFeed.ts` query uses an explicit foreign key reference `page:pages!posts_page_id_fkey` but **no foreign key constraint exists** on `posts.page_id`. This causes the entire Supabase query to fail silently, resulting in zero posts loading — which makes it look like posting is broken.

## Plan

### 1. Add Missing Foreign Key (Database Migration)
Add a foreign key from `posts.page_id` to `pages.id` so the join works:
```sql
ALTER TABLE public.posts 
ADD CONSTRAINT posts_page_id_fkey 
FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE SET NULL;
```

### 2. Fix `useFeed.ts` Query (Defensive)
Also make the page join more defensive — use a hint-free approach so it doesn't break if the FK name changes:
```
page:pages (name, username, avatar_url, is_verified)
```
But since the FK migration is needed anyway, we'll keep the explicit FK reference after creating the constraint.

### 3. Verify Comment System Works
The threaded comments implementation looks correct:
- `comments` table has `parent_id`, `likes_count` — correct
- `comment_likes` table exists — correct
- `ThreadedComment.tsx` has collapsible replies, `@mention` on reply — correct
- `useTopComment.ts` fetches the highest-liked root comment — correct
- `isCommentLiked` is properly passed per-comment — correct

No changes needed for comments.

## Files to Change
- **Database migration**: Add FK constraint `posts_page_id_fkey`
- **`src/hooks/useFeed.ts`**: Use hint-free join syntax as fallback safety

This single FK issue is what broke the entire feed display.

