
# Telegram Bot for File-to-Link Generation

## Overview
Create a Telegram bot that receives files from authorized admins, forwards them to a designated Telegram channel, and returns stream/download links that can be pasted into the admin panel.

## How It Works

**Flow:**
1. Admin sends a file (video, document, etc.) to the bot on Telegram
2. Bot verifies the sender is an authorized admin (by Telegram user ID)
3. Bot forwards the file to a designated Telegram channel
4. Bot replies with:
   - A direct Telegram file download link (via Bot API `getFile` for files under 20MB)
   - A channel message link (for all file sizes, never expires)
5. Admin copies the link and pastes it into the Movies Admin panel as `stream_url`, `telegram_url`, or `download_url`

**Why forward to a channel?**
- Telegram Bot API `getFile` only works for files up to 20MB
- Channel message links work for any file size and don't expire
- Provides a permanent archive of all uploaded files

## Setup Requirements (Before Building)

You will need to provide **3 secrets**:

1. **TELEGRAM_BOT_TOKEN** -- Create a bot via [@BotFather](https://t.me/BotFather) on Telegram, use the `/newbot` command, and copy the token
2. **TELEGRAM_CHANNEL_ID** -- The numeric ID of a Telegram channel where files will be forwarded (the bot must be added as an admin to this channel). You can get the ID by forwarding a message from the channel to [@userinfobot](https://t.me/userinfobot)
3. **TELEGRAM_ADMIN_IDS** -- Comma-separated Telegram user IDs of people allowed to use the bot (get your ID from [@userinfobot](https://t.me/userinfobot))

## Technical Details

### New Edge Function: `telegram-bot`

**File:** `supabase/functions/telegram-bot/index.ts`

Handles incoming Telegram webhook updates:

- **POST /telegram-bot** -- Receives Telegram updates
  - Validates the sender's Telegram user ID against `TELEGRAM_ADMIN_IDS`
  - If the message contains a file (document, video, audio, photo):
    - Forwards the file to the channel specified by `TELEGRAM_CHANNEL_ID`
    - For files under 20MB: calls Telegram `getFile` API to generate a direct download link
    - Generates a channel message link from the forwarded message
    - Replies to the admin with both links formatted for easy copying
  - If the sender is not authorized, replies with "Unauthorized"
  - Supports `/start` command with a welcome message

### New Edge Function: `telegram-bot-setup`

**File:** `supabase/functions/telegram-bot-setup/index.ts`

One-time setup endpoint to register the webhook URL with Telegram:

- **POST /telegram-bot-setup** -- Calls Telegram's `setWebhook` API to point to the `telegram-bot` edge function URL
- Only needs to be called once after deployment

### Config Update

**File:** `supabase/config.toml`

Add both new functions with `verify_jwt = false` (Telegram sends webhooks directly, authentication is handled by checking admin IDs in code).

### Bot Reply Format

When an admin sends a file, the bot replies with a message like:

```
-- File Received --
Name: movie-file.mkv
Size: 1.5 GB

Stream/Download Links:
- Channel Link: https://t.me/c/CHANNEL_ID/MSG_ID
- Direct Link: https://api.telegram.org/file/bot.../path (only for files under 20MB)

Copy the Channel Link and paste it as telegram_url in the admin panel.
```

### No UI Changes Needed

Since you selected "just return links," no changes to the admin panel or movie forms are needed. You will simply copy the links from the Telegram bot chat and paste them into the existing URL fields in Movies Admin.

## Summary of Changes

| What | Action |
|------|--------|
| `supabase/functions/telegram-bot/index.ts` | Create -- webhook handler for Telegram bot |
| `supabase/functions/telegram-bot-setup/index.ts` | Create -- one-time webhook registration |
| `supabase/config.toml` | Update -- add both new functions |
| 3 new secrets | Add TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, TELEGRAM_ADMIN_IDS |
