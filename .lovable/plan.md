

# Facebook-Style Pages System Enhancement

## Current State
The page system foundation exists but is bare-bones: basic page creation, follow/unfollow, a simple page profile with a text-only post creator, and feed integration for followed pages. What's missing is the full Facebook-like experience you want.

## What Needs to Change

### 1. Enhanced Page Profile (`PageProfilePage.tsx`)
- Add **media upload support** to the page post creator (images/videos), matching the existing `CreatePostSimple` pattern with image preview, file upload to `posts` storage bucket
- Show page posts using **full PostCardModern** with proper page branding (page name/avatar instead of user info)
- Add **"About" section** below the header showing bio, category, website, contact email
- Add a **tab system**: Posts | About tabs
- Show a **"Like Page"** button (same as follow, but labeled like Facebook)
- Add **post count** display alongside follower count

### 2. Page Attribution on Posts (`PostCardModern.tsx`)
- Add optional `page_name`, `page_username`, `page_avatar`, `page_id` fields to `PostCardModernProps`
- When a post has page info: show page avatar/name as the primary author, with a small "Published by [user]" subtitle
- Clicking the page name/avatar navigates to `/page/:username` instead of user profile
- The "Follow" button on page posts should follow the page, not the user

### 3. Feed Integration (`Feed.tsx`)
- When rendering posts from the feed, detect if a post has `page_id` and fetch/display page info
- Update the feed query in `useFeed.ts` to also select page data: join `pages` table when `page_id` is present
- Page posts in the global feed show with page branding

### 4. Page Post Creator with Media (`PageProfilePage.tsx`)
- Replace the basic Textarea with a proper post creator matching `CreatePostSimple` functionality:
  - Image/video upload support
  - Hashtag support
  - Feeling/activity support
  - Media preview before posting
- Upload media to `posts` storage bucket
- Update `createPagePost` in `usePages.ts` to accept media files and upload them

### 5. Post Interface Update (`usePosts.ts`)
- Add `page_id` to the `Post` interface
- Add optional `page` field with `{ name, username, avatar_url, is_verified }` for joined page data

### 6. Feed Query Enhancement (`useFeed.ts`)
- Join `pages` table data on posts that have `page_id`:
  ```
  pages:page_id (name, username, avatar_url, is_verified)
  ```
- Pass page data through to PostCardModern in `Feed.tsx`

## Files to Edit
- `src/pages/PageProfilePage.tsx` — full rewrite with media post creator, tabs, enhanced UI
- `src/components/PostCard/PostCardModern.tsx` — add page attribution props and rendering
- `src/hooks/usePosts.ts` — add `page_id` and page info to Post interface
- `src/hooks/useFeed.ts` — join pages table in feed query
- `src/hooks/usePages.ts` — add media upload to `createPagePost`
- `src/pages/Feed.tsx` — pass page data when rendering page posts

## No Database Changes Needed
All tables and columns already exist (`pages`, `page_members`, `page_followers`, `posts.page_id`).

