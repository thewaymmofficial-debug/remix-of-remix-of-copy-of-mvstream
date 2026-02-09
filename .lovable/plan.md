

# Fix Episode Downloads and Remove Series Download Button

## Problem Summary

1. **Episode download not working like movies**: When clicking "Download" on a series episode, it currently just opens the URL in a new browser tab. It should use the same in-app download manager (with progress tracking, pause/resume) that movies use via the `ServerDrawer` component.

2. **Series detail page has a useless Download button**: The main Download button on a series page doesn't make sense because you can't download an entire series at once -- each episode needs to be downloaded individually.

## Changes

### 1. Hide Download button on series detail page (`MovieDetails.tsx`)

- Conditionally hide the Download button when `movie.content_type === 'series'`
- Keep the Favorite button centered when Download is hidden
- Remove the download `ServerDrawer` for series content

### 2. Add ServerDrawer-based downloading to episode cards (`SeasonEpisodeList.tsx`)

- Import `useDownloadManager` from the DownloadContext
- Import `useNavigate` from react-router-dom
- Add a `ServerDrawer` state to the `SeasonEpisodeList` component (shared across all episodes)
- When user clicks Download on an episode:
  - If episode has only one download source (`download_url`), trigger the download manager directly (same as movies)
  - If episode has multiple sources (download_url, telegram_url, mega_url), open a `ServerDrawer` to let the user choose
- The download will use `startDownload()` from DownloadContext which proxies through the edge function, tracks progress, and allows pause/resume
- Navigate to `/downloads` page after starting

### 3. Pass series info to episode downloads

- Pass the parent movie's `title`, `poster_url`, `year`, `resolution` to the episode download so the Download Manager shows meaningful info
- The episode title will be appended (e.g., "Series Name - S1E3 Episode Title")

## Technical Details

### Files to modify:

**`src/pages/MovieDetails.tsx`**
- Wrap the Download button and its ServerDrawer in a condition: only show when `movie.content_type !== 'series'`

**`src/components/SeasonEpisodeList.tsx`**
- Add props for movie metadata (title, posterUrl, year, resolution, fileSize) needed by the download manager
- Import `ServerDrawer`, `useDownloadManager`, `useNavigate`, and `useAuth`
- Add state for tracking which episode's download drawer is open
- When Download is clicked on an episode:
  - Use the `ServerDrawer` with episode-specific URLs (download_url, telegram_url, mega_url)
  - Pass `movieInfo` with episode-specific title formatting (e.g., "Movie Title - EP3")
  - The ServerDrawer's `startDownload` handles the proxy + progress tracking automatically

**`src/pages/MovieDetails.tsx`** (props update)
- Pass additional movie info props to `SeasonEpisodeList` so the download manager can display proper metadata

