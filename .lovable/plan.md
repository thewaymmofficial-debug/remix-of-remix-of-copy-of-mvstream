

# Telegram Bot File Hosting for Movie Streaming

## Overview

Build a self-hosted file hosting system using a Telegram bot. You send/forward movies to the bot via Telegram, the bot stores them in a Telegram channel, and the app generates streaming links -- bypassing Myanmar ISP blocks and eliminating audio issues caused by proxies.

## How It Works

1. You create a Telegram bot via @BotFather
2. You send movie files to the bot in Telegram
3. The bot automatically forwards the file to your admin channel and saves the file metadata (file_id, file size, etc.) to the database
4. In the admin panel, you can link a Telegram file to any movie
5. When users press "Play", the app streams the video directly from Telegram's servers through a lightweight edge function proxy

## Important Limitation

Telegram's Bot API only allows downloading files up to **20MB** via `getFile`. For full-size movies (hundreds of MB to several GB), we have two options:

- **Option A (Recommended)**: Run a [Local Bot API Server](https://core.telegram.org/bots/api#using-a-local-bot-api-server) on a cheap VPS -- this removes the 20MB limit entirely and gives you unlimited file streaming
- **Option B**: Use a third-party Telegram file proxy/CDN worker (like your existing Cloudflare Worker) to stream large files

For now, the plan builds the full bot + database + admin UI + streaming infrastructure. You can start testing with small files and later plug in a Local Bot API server URL as a simple config change.

## What Gets Built

### 1. Database: `telegram_files` table

Stores metadata for every file the bot receives:

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| file_id | text | Telegram's file identifier (used to download) |
| file_unique_id | text | Unique file identifier (for deduplication) |
| file_name | text | Original filename |
| file_size | bigint | File size in bytes |
| mime_type | text | e.g. video/mp4 |
| message_id | integer | Message ID in the channel |
| channel_id | text | Channel where file is stored |
| movie_id | uuid (nullable) | Link to a movie in the movies table |
| created_at | timestamp | When uploaded |

### 2. Edge Function: `telegram-bot` (webhook)

Receives Telegram webhook updates when you send a file to the bot:

- Validates the update contains a video/document
- Forwards the file to your admin channel (for backup/organization)
- Extracts file_id, file_size, mime_type, file_name
- Saves to `telegram_files` table
- Replies to you in Telegram with a confirmation message

### 3. Edge Function: `telegram-stream`

Serves as the streaming endpoint for the app:

- Accepts a `file_id` parameter
- Calls Telegram's `getFile` API to get the temporary file path
- Proxies/redirects the file to the client with proper headers (Content-Type, Range support for seeking)
- Supports `Range` headers so users can seek in the video

### 4. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_ID` secrets

You'll need to:
- Create a bot via @BotFather and get the token
- Create a channel, add the bot as admin, and note the channel ID

### 5. Admin Panel: Link Telegram files to movies

Add a section in the Movies Admin page where you can:
- See a list of uploaded Telegram files (with filename, size, date)
- Click to assign a Telegram file to a movie
- The movie's `stream_url` gets set to the `telegram-stream` endpoint URL

### 6. Update `ServerDrawer` and `Watch.tsx`

- Add "Telegram Server" as a play option when a movie has a linked Telegram file
- Watch.tsx already handles direct video URLs, so it will work as-is once the stream URL points to the `telegram-stream` edge function

## Setup Steps (for you)

1. Open Telegram, message @BotFather, create a new bot, save the token
2. Create a Telegram channel (can be private), add the bot as admin
3. Get the channel ID (forward a message from the channel to @userinfobot or similar)
4. Add the bot token and channel ID as secrets in the project
5. After deployment, set the bot's webhook URL to the `telegram-bot` edge function URL

## Technical Details

### telegram-bot edge function (webhook handler)

```text
POST /telegram-bot
  -> Validate update has video or document
  -> Forward message to admin channel via Bot API
  -> Extract file_id, file_name, file_size, mime_type
  -> INSERT into telegram_files table
  -> Reply to sender with confirmation
```

### telegram-stream edge function (streaming proxy)

```text
GET /telegram-stream?file_id=xxx
  -> Call getFile API with file_id
  -> Get file_path from response
  -> Fetch https://api.telegram.org/file/bot<TOKEN>/<file_path>
  -> Stream response body to client with Range support
```

### Database migration

- Create `telegram_files` table with RLS (admin-only insert/update/delete, public select)
- Add foreign key to `movies` table (nullable movie_id)

### Movies Admin changes

- Add a "Telegram Files" tab or section
- Show unlinked files with a "Link to Movie" button
- When linked, auto-set the movie's stream_url to the telegram-stream endpoint

