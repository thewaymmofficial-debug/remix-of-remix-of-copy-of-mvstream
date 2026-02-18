

# Add Custom Local Bot API Server URL Support

## Overview

Add a configurable "Telegram Bot API Server URL" setting in the admin panel. When set, the `telegram-stream` edge function will use this custom server instead of the default `https://api.telegram.org`, removing the 20MB file size limit and enabling full movie streaming.

## Changes

### 1. Database: Insert default setting row

Add a new row in `site_settings` with key `telegram_bot_api_url` and an empty/null value. When empty, the system falls back to the default Telegram API.

### 2. Update `useSiteSettings` hook

- Add `telegramBotApiUrl` (string) to the returned settings object
- Export the type so it's accessible elsewhere

### 3. Update `telegram-stream` edge function

- Before constructing the Telegram API URLs, query `site_settings` for the `telegram_bot_api_url` key
- If a custom URL is set (e.g. `http://your-vps:8081`), use it instead of `https://api.telegram.org`
- The `getFile` call becomes `{customUrl}/bot{TOKEN}/getFile?file_id=...`
- The file download becomes `{customUrl}/file/bot{TOKEN}/{filePath}`
- Falls back to the standard API when no custom URL is configured

### 4. Update `SettingsAdmin.tsx`

Add a new collapsible "Telegram Bot API" section with:
- An input field for the custom server URL (e.g. `http://your-vps:8081`)
- Helper text explaining what this is and when to use it
- A save button
- A note about the 20MB limit when using the default API

### 5. Update `TelegramFilesAdmin.tsx`

Add a small status indicator showing whether a custom Bot API server is configured (helps the admin know if large file streaming will work).

## Technical Details

### telegram-stream changes

The edge function will read the setting from the database at request time:

```text
GET /telegram-stream?file_id=xxx
  -> Read 'telegram_bot_api_url' from site_settings via Supabase client
  -> baseUrl = customUrl || 'https://api.telegram.org'
  -> Call {baseUrl}/bot<TOKEN>/getFile?file_id=xxx
  -> Stream from {baseUrl}/file/bot<TOKEN>/<file_path>
```

### Site Settings admin section

A new "Telegram" collapsible section in the Settings page with:
- URL input field
- Description: "Set a custom Local Bot API Server URL to stream files larger than 20MB. Leave empty to use the default Telegram API (20MB limit)."
- Save button

