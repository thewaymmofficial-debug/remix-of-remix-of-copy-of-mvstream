

# Fix Download Proxy Edge Function

## What's Wrong

Two issues are preventing downloads from working:

1. **TypeScript error on line 73-75**: The `catch` block uses `error` without type annotation, and accesses `.message` and `.stack` on an `unknown` type. This causes a build failure (`TS18046: 'error' is of type 'unknown'`), preventing the latest version from deploying.

2. **Upstream server redirects (HTTP 302)**: The file servers often respond with a 302 redirect. Without explicit `redirect: 'follow'`, the proxy may pass the redirect response back to the browser, which then fails due to CORS restrictions. This causes downloads to hang or time out.

## Changes (1 file)

### `supabase/functions/download-proxy/index.ts`

**Fix 1 - Follow redirects explicitly (line 38):**
```typescript
// Before:
const response = await fetch(targetUrl, { headers });

// After:
const response = await fetch(targetUrl, { headers, redirect: 'follow' });
```

**Fix 2 - Type-safe error handling (lines 73-78):**
```typescript
// Before:
} catch (error) {
    console.error("[download-proxy] Error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "Proxy fetch failed" }), {

// After:
} catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : '';
    console.error("[download-proxy] Error:", errMsg, errStack);
    return new Response(JSON.stringify({ error: errMsg || "Proxy fetch failed" }), {
```

After these edits, the edge function will be redeployed automatically, and downloads should start working for both movies and series episodes.

