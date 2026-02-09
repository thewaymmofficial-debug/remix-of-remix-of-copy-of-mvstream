import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");

    console.log("[download-proxy] Resolve request for:", targetUrl);

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use redirect: 'manual' to capture redirect without following or downloading body
    // This avoids compute limits since we only read headers
    let finalUrl = targetUrl;
    let currentUrl = targetUrl;
    const maxRedirects = 10;

    for (let i = 0; i < maxRedirects; i++) {
      console.log(`[download-proxy] Checking redirect (${i + 1}):`, currentUrl);
      
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
      });

      // If it's a redirect, follow it manually
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("Location");
        if (!location) {
          console.log("[download-proxy] Redirect without Location header");
          break;
        }
        // Consume/discard the body to free resources
        await response.body?.cancel();
        
        // Handle relative redirects
        currentUrl = location.startsWith("http") ? location : new URL(location, currentUrl).href;
        finalUrl = currentUrl;
        console.log("[download-proxy] Redirected to:", finalUrl);
        continue;
      }

      // Not a redirect - this is the final URL
      // Get content info from headers before discarding body
      const contentLength = response.headers.get("Content-Length");
      const contentType = response.headers.get("Content-Type");
      
      // Discard body immediately to avoid compute limits
      await response.body?.cancel();

      console.log("[download-proxy] Final URL:", finalUrl);
      console.log("[download-proxy] Content-Length:", contentLength);

      return new Response(JSON.stringify({
        resolvedUrl: finalUrl,
        contentLength: contentLength ? parseInt(contentLength, 10) : null,
        contentType: contentType || "application/octet-stream",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we exhausted redirects, return what we have
    console.log("[download-proxy] Max redirects reached, using:", finalUrl);
    return new Response(JSON.stringify({
      resolvedUrl: finalUrl,
      contentLength: null,
      contentType: "application/octet-stream",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : '';
    console.error("[download-proxy] Error:", errMsg, errStack);
    return new Response(JSON.stringify({ error: errMsg || "Proxy fetch failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
