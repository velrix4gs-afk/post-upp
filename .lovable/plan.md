

# Connect Story Creation to the New Instagram-Style Editor

## Problem
The "Your Story" button in the feed opens an old basic dialog with a simple text input and file picker. The new full-featured Instagram-style story editor at `/create/story` exists but is not reachable from the feed.

## What Changes

### 1. Replace the old dialog with navigation to `/create/story`
In `src/components/Stories.tsx`, the "Your Story" circle currently wraps a `Dialog` with a basic form. This will be changed to simply navigate to `/create/story` on click, removing the old dialog entirely.

### What stays the same
- The story circles layout and styling
- The story viewer dialog (for viewing existing stories)
- The delete button on stories
- All hover cards, avatars, gradient rings
- The `useStories` hook usage for viewing/deleting
- The new `CreateStoryPage` component (untouched)

## Technical Details

**File:** `src/components/Stories.tsx`

- Remove the `createDialogOpen`, `content`, `mediaFile`, `mediaPreview` state variables
- Remove `handleFileSelect` and `handleCreateStory` functions
- Remove the `Dialog`/`DialogTrigger`/`DialogContent` wrapping the "Your Story" circle
- Replace with a simple `div` that calls `navigate('/create/story')` on click
- Remove unused imports (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`, `Input`, `Label`, `Camera`, `Video`, `createStory`)
- Add `useNavigate` from react-router-dom

The "Your Story" circle keeps its exact same visual appearance (avatar, plus badge, label) -- only the click behavior changes from opening a dialog to navigating to the new page.

