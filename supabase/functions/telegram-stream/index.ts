import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const API_ID = 2040;
const API_HASH = "b18441a1ff607e10a989891a5462e627";
const BOT_TOKEN = "7684270072:AAGPUfKdSTfk4VCZAie4PsnNKLhebO0hyqA";
const CHANNEL_ID = "-1003139915696";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers":
    "Content-Range, Accept-Ranges, Content-Length, Content-Type",
};

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

function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return contentTypeMap[ext] || "application/octet-stream";
}

// ─── Cached GramJS session (persists across requests in the same isolate) ───

let cachedSessionString = "";
let cachedClient: any = null;
let clientReady = false;
let connectPromise: Promise<void> | null = null;

async function getOrCreateClient() {
  const telegramModule = await import("npm:telegram@2");
  const TelegramClient = telegramModule.TelegramClient;
  const { StringSession } = await import("npm:telegram@2/sessions/index.js");

  // If we already have a connected client, reuse it
  if (cachedClient && clientReady) {
    console.log("Reusing cached GramJS client");
    return { client: cachedClient, Api: telegramModule.Api };
  }

  // If another request is already connecting, wait for it
  if (connectPromise) {
    console.log("Waiting for existing connection...");
    await connectPromise;
    if (cachedClient && clientReady) {
      return { client: cachedClient, Api: telegramModule.Api };
    }
  }

  // Create new client with cached session (avoids re-auth if session is saved)
  console.log(`Creating new GramJS client (session length: ${cachedSessionString.length})`);
  const session = new StringSession(cachedSessionString);
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
    useWSS: true,
  });

  connectPromise = (async () => {
    await client.start({ botAuthToken: BOT_TOKEN });
    // Save the authenticated session for future reuse
    cachedSessionString = client.session.save() as string;
    cachedClient = client;
    clientReady = true;
    console.log(`GramJS client connected, session cached (length: ${cachedSessionString.length})`);
  })();

  await connectPromise;
  connectPromise = null;

  return { client: cachedClient!, Api: telegramModule.Api };
}

// ─── MTProto streaming via GramJS (unlimited file size) ───

async function handleMTProtoStream(req: Request, msgId: number) {
  const bigInt = (await import("npm:big-integer")).default;

  try {
    console.log(`MTProto stream request for msg_id: ${msgId}`);

    const { client, Api } = await getOrCreateClient();

    // Resolve channel entity and get the message
    const channelEntity = await client.getEntity(CHANNEL_ID);
    const messages = await client.getMessages(channelEntity, {
      ids: [msgId],
    });
    const message = messages[0];

    if (!message || !message.media) {
      return new Response(
        JSON.stringify({ error: "Message not found or has no media" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract document from media
    const media = message.media;
    let document: any = null;

    if (media.className === "MessageMediaDocument" && media.document?.className === "Document") {
      document = media.document;
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported media type — only documents/videos supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fileSize = Number(document.size);

    // Get filename from attributes
    let fileName = "file";
    for (const attr of document.attributes || []) {
      if (attr.className === "DocumentAttributeFilename") {
        fileName = attr.fileName;
        break;
      }
    }

    const contentType = getContentType(fileName);
    console.log(`File: ${fileName}, Size: ${fileSize}, Type: ${contentType}`);

    // Parse Range header
    const rangeHeader = req.headers.get("range");
    let start = 0;
    let end = fileSize - 1;

    if (rangeHeader && fileSize > 0) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        start = parseInt(match[1], 10);
        end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      }
    }

    const responseLength = end - start + 1;
    const REQUEST_SIZE = 512 * 1024; // 512KB — must be power of 2, max 1MB
    const alignedStart = Math.floor(start / REQUEST_SIZE) * REQUEST_SIZE;
    const skipBytes = start - alignedStart;

    console.log(
      `Streaming bytes ${start}-${end}/${fileSize} (aligned from ${alignedStart}, skip ${skipBytes})`
    );

    // Build InputDocumentFileLocation
    const inputLocation = new Api.InputDocumentFileLocation({
      id: document.id,
      accessHash: document.accessHash,
      fileReference: document.fileReference,
      thumbSize: "",
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let bytesWritten = 0;
          let isFirstChunk = true;

          for await (const chunk of client.iterDownload({
            file: inputLocation,
            offset: bigInt(alignedStart),
            requestSize: REQUEST_SIZE,
            dcId: document.dcId,
            fileSize: document.size,
          })) {
            let data = new Uint8Array(chunk);

            // On first chunk, skip alignment padding
            if (isFirstChunk && skipBytes > 0) {
              data = data.slice(skipBytes);
              isFirstChunk = false;
            } else {
              isFirstChunk = false;
            }

            // Trim to remaining needed bytes
            const remaining = responseLength - bytesWritten;
            if (remaining <= 0) break;
            if (data.length > remaining) {
              data = data.slice(0, remaining);
            }

            controller.enqueue(data);
            bytesWritten += data.length;

            if (bytesWritten >= responseLength) break;
          }

          controller.close();
        } catch (err) {
          console.error("Stream chunk error:", err);
          controller.error(err);
        }
        // NOTE: Do NOT disconnect — client is cached for reuse
      },
    });

    const headers: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Content-Length": String(responseLength),
    };

    // Download disposition
    const download = new URL(req.url).searchParams.get("download");
    if (download === "true") {
      headers["Content-Disposition"] = `attachment; filename="${fileName}"`;
    }

    if (rangeHeader) {
      headers["Content-Range"] = `bytes ${start}-${end}/${fileSize}`;
      return new Response(stream, { status: 206, headers });
    }

    return new Response(stream, { status: 200, headers });
  } catch (error: any) {
    console.error("MTProto stream error:", error);

    // If we got a FloodWaitError, invalidate cached client so next request retries fresh
    if (error?.errorMessage === "FLOOD" || error?.message?.includes("FloodWaitError")) {
      cachedClient = null;
      clientReady = false;
      // Keep cachedSessionString — it's still valid, just rate-limited
      const waitSeconds = error?.seconds || 0;
      return new Response(
        JSON.stringify({
          error: "Telegram rate limit — please try again later",
          retry_after_seconds: waitSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(waitSeconds),
          },
        }
      );
    }

    // For auth errors, invalidate the session entirely
    if (error?.message?.includes("auth") || error?.message?.includes("AUTH")) {
      cachedClient = null;
      clientReady = false;
      cachedSessionString = "";
    }

    return new Response(
      JSON.stringify({
        error: "Failed to stream file via MTProto",
        details: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// ─── Bot API fallback (max 20MB) ───

async function handleBotApiStream(req: Request, fileId: string) {
  try {
    console.log(`Bot API stream for file_id: ${fileId}`);

    const getFileRes = await fetch(`${TELEGRAM_API}/getFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });

    const getFileData = await getFileRes.json();
    if (!getFileData.ok || !getFileData.result?.file_path) {
      const errorMsg = getFileData.description || "Failed to get file";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filePath = getFileData.result.file_path;
    const fileSize = getFileData.result.file_size || 0;
    const telegramFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    const contentType = getContentType(filePath);

    // Range support
    const rangeHeader = req.headers.get("range");
    if (rangeHeader && fileSize > 0) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

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

    const fileRes = await fetch(telegramFileUrl);
    const headers: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    };
    if (fileSize > 0) headers["Content-Length"] = String(fileSize);

    const reqUrl = new URL(req.url);
    if (reqUrl.searchParams.get("download") === "true") {
      const name = reqUrl.searchParams.get("name") || filePath.split("/").pop() || "file";
      headers["Content-Disposition"] = `attachment; filename="${name}"`;
    }

    return new Response(fileRes.body, { status: 200, headers });
  } catch (error) {
    console.error("Bot API stream error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// ─── Main handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const msgId = url.searchParams.get("msg_id");
    const fileId = url.searchParams.get("file_id");

    if (msgId) {
      return await handleMTProtoStream(req, parseInt(msgId, 10));
    } else if (fileId) {
      return await handleBotApiStream(req, fileId);
    } else {
      return new Response(
        JSON.stringify({ error: "Missing msg_id or file_id parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
