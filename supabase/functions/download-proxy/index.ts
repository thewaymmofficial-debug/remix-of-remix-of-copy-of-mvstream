import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    console.log("[download-proxy] Stream request for:", targetUrl, "filename:", filenameParam);

    if (!targetUrl) {
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
      console.log("[download-proxy] Range header:", rangeHeader);
    }

    // Fetch the target URL and stream the response
    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      redirect: "follow",
    });

    console.log("[download-proxy] Upstream status:", response.status);
    console.log("[download-proxy] Content-Length:", response.headers.get("Content-Length"));
    console.log("[download-proxy] Content-Type:", response.headers.get("Content-Type"));

    // Build response headers
    const responseHeaders: Record<string, string> = { ...corsHeaders };
    
    // Forward relevant headers
    const contentLength = response.headers.get("Content-Length");
    if (contentLength) responseHeaders["Content-Length"] = contentLength;
    
    const contentType = response.headers.get("Content-Type");
    responseHeaders["Content-Type"] = contentType || "application/octet-stream";
    
    const contentRange = response.headers.get("Content-Range");
    if (contentRange) responseHeaders["Content-Range"] = contentRange;
    
    const acceptRanges = response.headers.get("Accept-Ranges");
    if (acceptRanges) responseHeaders["Accept-Ranges"] = acceptRanges;

    // Add Content-Disposition so Android DownloadManager knows the filename
    if (filenameParam) {
      responseHeaders["Content-Disposition"] = `attachment; filename="${filenameParam}"`;
    } else {
      responseHeaders["Content-Disposition"] = "attachment";
    }

    // Stream the response body directly
    return new Response(response.body, {
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
