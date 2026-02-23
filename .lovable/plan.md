

## Add "MX Player" External Player Option

### Overview
Add a new "MX Player" URL field to movies so admins can provide a direct video link. When users tap "MX Player" in the play drawer, it opens the video directly in MX Player via an Android intent URI.

### Changes

#### 1. Database: Add `mx_player_url` column
- Run a migration to add `mx_player_url TEXT` to the `movies` table.

#### 2. Types: Update `Movie` and `MovieInsert`
- In `src/types/database.ts`, add `mx_player_url: string | null` to `Movie` and `mx_player_url?: string | null` to `MovieInsert`.

#### 3. Admin Panel: Add MX Player URL input
- In `src/pages/admin/MoviesAdmin.tsx`, add a text input field for "MX Player URL" in the movie form (next to the existing stream/telegram/mega/download URL fields).
- Add `mx_player_url: ''` to the `defaultMovie` object.

#### 4. ServerDrawer: Add MX Player option
- In `src/components/ServerDrawer.tsx`:
  - Add `mxPlayerUrl?: string | null` prop.
  - In the play servers list, add an "MX Player" entry when the URL is provided.
  - When tapped, construct an Android intent URI: `intent://...#Intent;scheme=https;action=android.intent.action.VIEW;type=video/*;package=com.mxtech.videoplayer.ad;end` to open directly in MX Player.
  - Falls back to opening the URL in browser if not on Android.

#### 5. MovieDetails: Pass `mxPlayerUrl` to ServerDrawer
- In `src/pages/MovieDetails.tsx`, pass `movie.mx_player_url` (or `(movie as any).mx_player_url`) to both play and download `ServerDrawer` instances.

#### 6. SeasonEpisodeList (if applicable)
- If episodes also use `ServerDrawer`, pass `mx_player_url` there too (check if `episodes` table needs the same column -- will add if the pattern already exists for other URL fields).

### Technical Details

The MX Player intent URI format:
```text
intent://<host><path><query>#Intent;scheme=https;action=android.intent.action.VIEW;type=video/*;package=com.mxtech.videoplayer.ad;end
```

This targets MX Player specifically via its package name. If MX Player is not installed, Android will show a "not found" message or redirect to the Play Store.

