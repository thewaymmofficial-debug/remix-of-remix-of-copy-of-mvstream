import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Type, Accept-Ranges",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    const filenameParam = url.searchParams.get("filename");

    console.log("[download-proxy]", req.method, "request for:", targetUrl, "filename:", filenameParam);

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward Range header for resume/seek support
    const headers: Record<string, string> = {};
    const rangeHeader = req.headers.get("Range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
      console.log("[download-proxy] Range header:", rangeHeader);
    }

    // Fetch the target URL (GET or HEAD)
    const response = await fetch(targetUrl, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      headers,
      redirect: "follow",
    });

    console.log("[download-proxy] Upstream status:", response.status);
    console.log("[download-proxy] Content-Length:", response.headers.get("Content-Length"));
    console.log("[download-proxy] Content-Type:", response.headers.get("Content-Type"));

    // Build response headers — passthrough from upstream
    const responseHeaders: Record<string, string> = { ...corsHeaders };

    // Pass through critical headers exactly as upstream sends them
    const passthrough = ["content-type", "content-length", "content-range", "accept-ranges"];
    for (const key of passthrough) {
      const val = response.headers.get(key);
      if (val) responseHeaders[key] = val;
    }

    // Always advertise Range support (CF worker supports it)
    if (!responseHeaders["Accept-Ranges"] && !responseHeaders["accept-ranges"]) {
      responseHeaders["Accept-Ranges"] = "bytes";
    }

    // Fallback content-type
    if (!responseHeaders["Content-Type"] && !responseHeaders["content-type"]) {
      responseHeaders["Content-Type"] = "application/octet-stream";
    }

    // When stream=1 is set, skip Content-Disposition so browser plays inline
    const isStream = url.searchParams.get("stream") === "1";
    if (!isStream) {
      if (filenameParam) {
        responseHeaders["Content-Disposition"] = `attachment; filename="${filenameParam}"`;
      } else {
        responseHeaders["Content-Disposition"] = "attachment";
      }
    }

    // Stream the response body directly, preserving upstream status (200 or 206)
    return new Response(req.method === "HEAD" ? null : response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[download-proxy] Error:", errMsg);
    return new Response(JSON.stringify({ error: errMsg || "Proxy fetch failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
