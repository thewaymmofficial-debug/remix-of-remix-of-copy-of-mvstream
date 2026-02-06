

# Unlimited Telegram File Streaming via MTProto

## The Problem

The current `telegram-stream` edge function uses the Telegram **Bot API** `getFile` endpoint, which has a hard **20MB file size limit**. Most movie files (1-5GB) are way above this limit, so the stream/download URLs don't work for real content. Only the channel link works, but it just opens Telegram -- not your app.

## The Solution

Replace the Bot API-based proxy with **MTProto protocol** streaming using the **GramJS** library (a JavaScript MTProto implementation). MTProto is the core Telegram protocol and has **no file size limit** -- it can stream files of any size directly to your app's video player.

## One-Time Setup Required

You need to get **two credentials** from Telegram (free, takes 2 minutes):

1. Go to [https://my.telegram.org](https://my.telegram.org)
2. Log in with your phone number
3. Click "API development tools"
4. Create an application (any name/description)
5. Copy the **api_id** (a number) and **api_hash** (a string)

These will be hardcoded alongside the existing bot token (as you requested for test credentials).

## What Changes

### 1. Rewrite `telegram-stream` Edge Function (MTProto-based)

Replace the current Bot API proxy with a GramJS-powered streaming proxy:
- Connects to Telegram servers via **WebSocket** (MTProto protocol)
- Authenticates as your bot using the bot token
- Downloads file chunks with **no size limit**
- Streams chunks directly to the browser via `ReadableStream`
- Supports **Range requests** for video seeking/scrubbing
- Detects content type from file extension for proper playback

### 2. Update `telegram-bot` Edge Function

- Remove the 20MB size warning/restriction
- **Always** generate stream and download URLs for every file (regardless of size)
- Bot reply will always include Stream URL, Download URL, and Channel Link
- Simplified, consistent response format

### 3. Add In-App Video Player Page

Create a new `/watch` route that plays videos inside your app:
- Uses the existing `VideoPlayer` component (already built with play/pause, seek, volume, fullscreen)
- Loads the stream URL from the `telegram-stream` proxy
- Full-screen video experience within the app
- No need to open external links or Telegram

### 4. Update ServerDrawer for In-App Playback

When user clicks "Play" and selects "Main Server":
- Instead of opening a new tab (`window.open`), navigate to the in-app `/watch` page
- Pass the stream URL and movie title
- Other servers (Telegram, MEGA) still open externally as before

## Technical Details

### MTProto Streaming Flow

```text
User clicks Play
       |
       v
ServerDrawer -> "Main Server"
       |
       v
Navigate to /watch?url=...&title=...
       |
       v
VideoPlayer <video src="telegram-stream?file_id=xxx">
       |
       v
telegram-stream Edge Function
       |
       v
GramJS (MTProto via WebSocket) -> Telegram DC
       |
       v
File chunks streamed back (ReadableStream)
       |
       v
Browser plays video (supports seeking via Range headers)
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/telegram-stream/index.ts` | Rewrite | MTProto-based streaming proxy using GramJS |
| `supabase/functions/telegram-bot/index.ts` | Update | Always generate stream/download URLs, remove 20MB restriction |
| `src/pages/Watch.tsx` | Create | In-app video player page |
| `src/components/ServerDrawer.tsx` | Update | Navigate to /watch for Main Server instead of window.open |
| `src/App.tsx` | Update | Add /watch route |

### Edge Function Dependencies

The `telegram-stream` function will use:
- `npm:telegram` (GramJS) - MTProto client for Deno
- WebSocket transport mode (no TCP needed, compatible with edge functions)
- `StringSession` for bot authentication

### Important Notes

- **api_id and api_hash** are required by Telegram for any MTProto connection -- these are free and permanent
- The bot token you already have is reused for MTProto bot authentication
- The existing channel forwarding flow stays the same
- Files are stored permanently in the Telegram channel (unlimited storage, no cost)
- Edge function acts as a pass-through proxy (no file stored on your server)

### Potential Risk

GramJS with WebSocket transport in Deno edge functions is a relatively new combination. If the WebSocket-based MTProto connection has issues in the Supabase Edge Function environment, we would need to explore alternative approaches (like a self-hosted Node.js proxy). However, this is the most promising approach that works within the current architecture.

