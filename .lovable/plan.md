

# Simplify Streaming: Keep Only Direct and Supabase Proxy

## Overview

Remove the Vercel proxy tier from the streaming cascade, leaving only **Direct** and **Supabase Proxy**. This eliminates the broken Vercel tier that wastes ~2 seconds on every video play.

## Changes

### 1. `src/pages/Watch.tsx`

- Remove `PROXY_STREAM_ORIGIN` constant
- Remove `'vercel'` from the `StreamTier` type (becomes `'direct' | 'supabase'`)
- Remove the `vercel` entry from `TIER_CONFIG`
- Remove `vercelUrl` from `ResolvedUrls` interface and from `resolveVideoUrls()`
- Remove `vercel` from `getTierUrl()`
- Update `resolveVideoUrls()` to fetch the watch page HTML via the **Supabase proxy** first (most reliable), then fall back to direct fetch -- fixing the current CORS/400 error
- The cascade becomes: Direct -> Supabase (2 tiers only)

### 2. `src/lib/utils.ts`

- Remove the `proxyStreamUrl()` function (no longer needed)

### 3. `src/components/ServerDrawer.tsx`

- Remove the import of `proxyStreamUrl`
- In `handleOpen()`, use the raw URL directly instead of calling `proxyStreamUrl()`

## Result

- Videos start ~4-5 seconds faster (no Vercel probe delay)
- Watch page HTML resolution uses Supabase proxy first (works in Myanmar)
- Cascade: Direct (try for 6s) -> Supabase (instant fallback)
- Cleaner, simpler code with no dead proxy references

