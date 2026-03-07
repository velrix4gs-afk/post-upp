

# Build Page System MVP

## Current State
- **`pages` table** exists with: id, name, username, description, category, avatar_url, cover_url, website_url, contact_email, is_verified, is_official, created_by, followers_count, created_at, updated_at
- **`page_followers` table** exists with: id, page_id, user_id, created_at
- **`page_members` table** does NOT exist (needed for roles: owner, admin, editor, moderator)
- **`posts` table** has NO `page_id` column (needed to link posts to pages)
- **`creator_pages` table** exists separately — used by `useCreatorPages` hook and `PagesPage.tsx`. This is a different system from the `pages` table used by `usePages` hook and `PagesDirectory.tsx`
- **No public page profile route** (`/page/:username`) exists — only `/page/:pageId/edit`
- RLS policies exist for pages and page_followers
- `update_page_followers_count` trigger function exists

## Problem: Two Competing Page Systems
There are two separate systems:
1. `pages` table + `usePages` hook + `PagesDirectory.tsx` — simple pages with name/username
2. `creator_pages` table + `useCreatorPages` hook + `PagesPage.tsx` — creator pages with slug/title

**Decision**: Consolidate onto the `pages` table since it matches the user's spec. Remove usage of `creator_pages` from the pages UI. The `creator_pages` table stays for creator studio features.

## Database Changes

### 1. Create `page_members` table
```sql
CREATE TABLE public.page_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'moderator')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);
ALTER TABLE public.page_members ENABLE ROW LEVEL SECURITY;
```
RLS: viewable by everyone, insertable/updatable/deletable by page owner/admin.

### 2. Add `page_id` to `posts` table
```sql
ALTER TABLE public.posts ADD COLUMN page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL;
```
This lets posts belong to either a user or a page (or both — user creates a post on behalf of a page).

### 3. Auto-insert owner into `page_members` on page creation
A trigger that inserts the page creator as `owner` in `page_members`.

### 4. Add `bio` column to `pages` (the spec uses "bio", table has "description")
Not needed — `description` serves as bio. Will use it as-is.

## Frontend Changes

### 1. Rewrite `src/pages/PagesPage.tsx`
Consolidate onto `pages` table. Three tabs: Discover, Following, My Pages. Use `usePages` hook (not `useCreatorPages`). Wire up follow/unfollow, create page dialog, link to page profile and edit.

### 2. Create `src/pages/PageProfilePage.tsx` — Public Page Profile
Route: `/page/:username`
- Displays page name, avatar, cover, bio, category, follower count
- Follow/unfollow button
- Page posts feed (posts where `page_id` matches)
- If owner/admin: "Manage" button linking to edit

### 3. Update `src/hooks/usePages.ts`
- Add `page_members` support
- Add method to create posts as a page
- Add method to fetch page posts
- Auto-assign owner role on create (handled by trigger, but also optimistic)

### 4. Update `src/pages/EditPagePage.tsx`
Switch from `creator_pages` to `pages` table. Add ability to post as the page and view/manage members.

### 5. Update `src/hooks/useFeed.ts`
Include page posts in feed for users following those pages. The feed query needs to also fetch posts where `page_id` is in the user's followed pages.

### 6. Update `src/App.tsx`
- Add route `/page/:username` → `PageProfilePage`
- Keep `/page/:pageId/edit` → `EditPagePage`
- Remove `PagesDirectory` route (consolidate into `PagesPage`)

### 7. Update `src/components/PostCard.tsx` or `PostCardModern.tsx`
Show page name/avatar instead of user name when a post has a `page_id`.

## Files to Create
- `src/pages/PageProfilePage.tsx` — public page profile with posts feed

## Files to Edit
- `src/pages/PagesPage.tsx` — rewrite to use `pages` table
- `src/pages/EditPagePage.tsx` — switch to `pages` table
- `src/hooks/usePages.ts` — add members, page posts, feed integration
- `src/hooks/useFeed.ts` — include followed page posts
- `src/App.tsx` — add page profile route
- `src/components/PostCard/PostCardModern.tsx` — show page attribution on page posts

## Migration Summary
1. Create `page_members` table with RLS
2. Add `page_id` column to `posts`
3. Create trigger to auto-add owner to `page_members`
4. Create security definer function `is_page_member` for RLS

