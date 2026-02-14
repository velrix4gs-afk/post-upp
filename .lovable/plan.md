
# Fix Story Viewer: Remove Duplicate Close Button, Playback HUD, and Add Caption Space

## Issues Found
1. **Two close buttons** -- The shadcn `DialogContent` automatically renders an X button in the top-right corner. There is also a manually coded X button. Both appear, causing confusion.
2. **Video playback HUD** -- The `<video>` element uses the `controls` attribute, which renders the browser/WebView's native playback bar (play, pause, seek, volume). This clutters the viewer.
3. **No caption area** -- Story text/content is only shown when there is no media. If a story has both media and text, the text is not displayed.

## What Will Change

### File: `src/components/Stories.tsx`

**1. Remove the duplicate close button**
- Remove the manual X `<Button>` (the one coded explicitly)
- Keep the built-in `DialogContent` close button (which is styled consistently)
- Alternatively, hide the built-in one and keep the custom one -- whichever fits the dark theme better. The custom one styled for dark backgrounds will be kept, and the built-in one will be hidden using the `[&>button]:hidden` class on `DialogContent`.

**2. Remove video `controls` attribute**
- Remove `controls` from the `<video>` tag so no native playback HUD appears
- Keep `autoPlay` and add `playsInline` and `muted` (for autoplay to work reliably in WebView)
- Add tap-to-pause/play functionality so users can still control playback by tapping the video

**3. Add caption overlay at the bottom**
- When a story has both media and text content, display the caption as a semi-transparent overlay at the bottom of the media area
- When there is no caption, the media fills the full viewer without any bottom bar
- Caption styling: white text on a gradient background (transparent to semi-black), positioned at the bottom of the media container

## What Stays the Same
- Story circles layout and styling in the feed
- Story click and view tracking logic
- Delete button for own stories
- Avatar, username, verification badge, and timestamp in the header
- The `useStories` hook and all data fetching
- The `CreateStoryPage` editor (untouched)
