const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

    const url = new URL(req.url);
    const fileId = url.searchParams.get("file_id");

    if (!fileId) {
      return new Response(JSON.stringify({ error: "file_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the file path from Telegram
    const getFileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const getFileData = await getFileRes.json();

    if (!getFileData.ok || !getFileData.result?.file_path) {
      return new Response(
        JSON.stringify({ error: "Failed to get file from Telegram", details: getFileData }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const filePath = getFileData.result.file_path;
    const fileSize = getFileData.result.file_size || 0;
    const telegramFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    // Determine content type from file path
    let contentType = "video/mp4";
    if (filePath.endsWith(".mkv")) contentType = "video/x-matroska";
    else if (filePath.endsWith(".avi")) contentType = "video/x-msvideo";
    else if (filePath.endsWith(".webm")) contentType = "video/webm";

    // Handle Range requests for seeking
    const rangeHeader = req.headers.get("Range");

    if (rangeHeader && fileSize > 0) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

        const telegramRes = await fetch(telegramFileUrl, {
          headers: { Range: `bytes=${start}-${end}` },
        });

        return new Response(telegramRes.body, {
          status: 206,
          headers: {
            ...corsHeaders,
            "Content-Type": contentType,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": String(end - start + 1),
            "Accept-Ranges": "bytes",
          },
        });
      }
    }

    // Full file fetch
    const telegramRes = await fetch(telegramFileUrl);

    return new Response(telegramRes.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        ...(fileSize > 0 ? { "Content-Length": String(fileSize) } : {}),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err) {
    console.error("Stream error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
