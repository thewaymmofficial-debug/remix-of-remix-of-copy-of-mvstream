
# Fix WebToApp APK -- Two Remaining Issues

## Problem 1: `current.className.includes is not a function`

WebToApp injects its own JavaScript scripts into the page. These scripts try to call `.includes()` on `element.className`, but in Android WebView, SVG elements return an `SVGAnimatedString` object for `className` instead of a regular string. This crashes the injected script and can prevent the app from working properly.

**Fix**: Add a small polyfill script in `index.html` that patches `SVGAnimatedString.prototype` so `.includes()` works on SVG className properties. This runs before any other script (including WebToApp's injected code).

## Problem 2: Missing CORS Headers in Cloudflare Worker

Even though you updated the Worker, the Supabase JS client sends a header called `Content-Profile` on POST/PATCH/DELETE requests (for inserting data, updating records, etc.). This header was **not included** in the explicit CORS list I gave you earlier, so the WebView blocks those requests.

**Fix (Your Action Required)**: Update the Cloudflare Worker one more time to add `content-profile` to the allowed headers list:

```javascript
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, content-profile, accept, accept-profile, prefer, range, x-supabase-api-version",
```

Note the addition of `content-profile` compared to the previous version.

## Changes

### File: `index.html`
Add a polyfill script before the main app script that:
- Patches `SVGAnimatedString.prototype` to support `.includes()`, `.indexOf()`, and other string methods
- This ensures WebToApp's injected scripts don't crash when they encounter SVG elements in the DOM

### File: No other code changes needed
The rest of the fix is updating your Cloudflare Worker (manual step).

## Steps to Complete

1. I add the polyfill to `index.html`
2. You update the Cloudflare Worker to add `content-profile` to `Access-Control-Allow-Headers`
3. Publish the app
4. Rebuild your WebToApp APK
5. Test without VPN

## Technical Details

The polyfill in `index.html` will look like:

```html
<script>
  // Fix for Android WebView: SVGAnimatedString doesn't have string methods
  try {
    if (typeof SVGAnimatedString !== 'undefined') {
      var proto = SVGAnimatedString.prototype;
      if (!proto.includes) {
        proto.includes = function(s) { return this.baseVal.includes(s); };
      }
      if (!proto.indexOf) {
        proto.indexOf = function(s) { return this.baseVal.indexOf(s); };
      }
      if (!proto.startsWith) {
        proto.startsWith = function(s) { return this.baseVal.startsWith(s); };
      }
    }
  } catch(e) {}
</script>
```

This is placed before the main app script so it runs before WebToApp's injected code and before React/next-themes initialize.
