

## Plan: Replace "MX Player" with "External Server" (In-App Proxied Playback)

### Summary
Replace the MX Player integration with an "External Server" option. URLs like `https://av-f2l-bot.avbotz26.workers.dev/watch/32379/AV_BOTZ.mkv?hash=AgADEA` will play **in-app** through the existing Watch page, which already knows how to fetch the HTML page, extract the `<source src="...">` video URL, and stream it through the Supabase download-proxy to bypass Myanmar ISP blocks.

### Changes

#### 1. `src/components/ServerDrawer.tsx`
- Remove `handleMxPlayer` function entirely (no more Android intent/MX Player logic)
- Rename `'MX Player'` to `'External Server'` in the servers list
- Change icon from `'mxplayer'` to `'external'`
- Set `inApp: true` so it routes through the in-app Watch player
- Remove the special `mxplayer` click handler check -- use standard `handleOpen` with `inApp: true`
- The prop name `mxPlayerUrl` stays the same internally (maps to `mx_player_url` DB column)

#### 2. `src/pages/Watch.tsx`
- Update `resolveDirectUrl` to handle the new `avbotz26.workers.dev` domain alongside the existing `thewayofthedragg.workers.dev` domain
- When a relative path is extracted from the HTML, build the full URL using the original page's origin (not hardcoded to one CF worker domain)

#### 3. `src/pages/admin/MoviesAdmin.tsx`
- Rename label from "MX Player URL" to "External Server URL"
- Update placeholder to `e.g. https://av-f2l-bot.avbotz26.workers.dev/watch/...`

### How It Works (Flow)
1. Admin adds External Server URL: `https://av-f2l-bot.avbotz26.workers.dev/watch/32379/AV_BOTZ.mkv?hash=AgADEA`
2. User taps "External Server" in play drawer
3. App navigates to `/watch?url=<encoded_url>&title=...`
4. Watch page detects `/watch/` in URL, fetches the HTML through Vercel proxy, extracts `<source src="...">` direct video URL
5. Streams video through Supabase download-proxy, bypassing ISP blocks
6. Video plays in-app with full controls, seek support, and progress tracking

### Technical Detail
The key fix in `Watch.tsx` line 49 currently hardcodes `tw.thewayofthedragg.workers.dev` for relative paths. This will be changed to dynamically use the origin from the original URL, so it works with any CF Workers domain.

