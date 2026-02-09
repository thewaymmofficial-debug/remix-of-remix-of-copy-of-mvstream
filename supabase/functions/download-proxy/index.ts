import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    const filename = url.searchParams.get("filename") || "download";

    console.log("[download-proxy] Redirect request for:", targetUrl);

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return a 302 redirect to the target URL.
    // This uses virtually zero compute resources — the browser follows
    // the redirect and downloads the file directly from the source.
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: targetUrl,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[download-proxy] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Proxy failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
