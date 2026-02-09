import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, Content-Type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");

    console.log("[download-proxy] Request for:", targetUrl);

    if (!targetUrl) {
      console.error("[download-proxy] Missing url parameter");
      return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward Range header for resume support
    const headers: Record<string, string> = {};
    const rangeHeader = req.headers.get("Range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
      console.log("[download-proxy] Forwarding Range:", rangeHeader);
    }

    console.log("[download-proxy] Fetching upstream:", targetUrl);
    const response = await fetch(targetUrl, { headers, redirect: 'follow' });
    console.log("[download-proxy] Upstream status:", response.status, response.statusText);

    if (!response.ok && response.status !== 206) {
      const errText = await response.text().catch(() => "");
      console.error("[download-proxy] Upstream error:", response.status, errText);
      return new Response(JSON.stringify({ error: `Upstream error: ${response.status} ${response.statusText}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build response headers - forward relevant ones from upstream
    const responseHeaders: Record<string, string> = { ...corsHeaders };

    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
      console.log("[download-proxy] Content-Length:", contentLength);
    }

    const contentRange = response.headers.get("Content-Range");
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    const contentType = response.headers.get("Content-Type");
    responseHeaders["Content-Type"] = contentType || "application/octet-stream";
    responseHeaders["Accept-Ranges"] = "bytes";

    console.log("[download-proxy] Streaming response back to client...");

    // Stream the response body directly
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
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
