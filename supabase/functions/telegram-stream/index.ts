import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BOT_TOKEN = "7684270072:AAGPUfKdSTfk4VCZAie4PsnNKLhebO0hyqA";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers":
    "Content-Range, Accept-Ranges, Content-Length, Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get("file_id");

    if (!fileId) {
      return new Response(
        JSON.stringify({ error: "Missing file_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Stream request for file_id: ${fileId}`);

    // Get file path from Telegram
    const getFileRes = await fetch(`${TELEGRAM_API}/getFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });

    const getFileData = await getFileRes.json();
    console.log("getFile response:", JSON.stringify(getFileData));

    if (!getFileData.ok || !getFileData.result?.file_path) {
      const errorMsg =
        getFileData.description || "Failed to get file from Telegram";

      // Check if it's a file size limitation
      if (
        errorMsg.includes("too big") ||
        errorMsg.includes("file is too large")
      ) {
        return new Response(
          JSON.stringify({
            error:
              "File is too large for Telegram Bot API streaming (>20MB limit). Use an external hosting service for large files.",
          }),
          {
            status: 413,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filePath = getFileData.result.file_path;
    const fileSize = getFileData.result.file_size || 0;
    const telegramFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    // Determine content type from file extension
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const contentTypeMap: Record<string, string> = {
      mp4: "video/mp4",
      mkv: "video/x-matroska",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      webm: "video/webm",
      mp3: "audio/mpeg",
      flac: "audio/flac",
      wav: "audio/wav",
      ogg: "audio/ogg",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
    };
    const contentType = contentTypeMap[ext] || "application/octet-stream";

    // Handle range requests for video seeking
    const rangeHeader = req.headers.get("range");

    if (rangeHeader && fileSize > 0) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        console.log(`Range request: bytes=${start}-${end}/${fileSize}`);

        const rangeRes = await fetch(telegramFileUrl, {
          headers: { Range: `bytes=${start}-${end}` },
        });

        return new Response(rangeRes.body, {
          status: 206,
          headers: {
            ...corsHeaders,
            "Content-Type": contentType,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": String(chunkSize),
            "Accept-Ranges": "bytes",
          },
        });
      }
    }

    // Full file response
    console.log(`Streaming full file: ${filePath} (${fileSize} bytes)`);
    const fileRes = await fetch(telegramFileUrl);

    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    };

    if (fileSize > 0) {
      responseHeaders["Content-Length"] = String(fileSize);
    }

    // For downloads, add disposition header if requested
    const download = url.searchParams.get("download");
    if (download === "true") {
      const fileName =
        url.searchParams.get("name") || filePath.split("/").pop() || "file";
      responseHeaders["Content-Disposition"] =
        `attachment; filename="${fileName}"`;
    }

    return new Response(fileRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
