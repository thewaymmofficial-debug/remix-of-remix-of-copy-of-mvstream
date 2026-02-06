import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BOT_TOKEN = "7684270072:AAGPUfKdSTfk4VCZAie4PsnNKLhebO0hyqA";
const CHANNEL_ID = "-1003139915696";
const ADMIN_IDS = ["6158106622"];

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const STREAM_BASE_URL = "https://icnfjixjohbxjxqbnnac.supabase.co/functions/v1/telegram-stream";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendMessage(chatId: number | string, text: string, parseMode = "HTML") {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  const data = await res.json();
  console.log("sendMessage response:", JSON.stringify(data));
  return data;
}

async function forwardMessage(chatId: string, fromChatId: number, messageId: number) {
  const res = await fetch(`${TELEGRAM_API}/forwardMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
    }),
  });
  const data = await res.json();
  console.log("forwardMessage response:", JSON.stringify(data));
  return data;
}

function getFileInfo(message: any): { fileId: string; fileName: string; fileSize: number } | null {
  if (message.document) {
    return {
      fileId: message.document.file_id,
      fileName: message.document.file_name || "document",
      fileSize: message.document.file_size || 0,
    };
  }
  if (message.video) {
    return {
      fileId: message.video.file_id,
      fileName: message.video.file_name || "video.mp4",
      fileSize: message.video.file_size || 0,
    };
  }
  if (message.audio) {
    return {
      fileId: message.audio.file_id,
      fileName: message.audio.file_name || "audio",
      fileSize: message.audio.file_size || 0,
    };
  }
  if (message.photo && message.photo.length > 0) {
    const largest = message.photo[message.photo.length - 1];
    return {
      fileId: largest.file_id,
      fileName: "photo.jpg",
      fileSize: largest.file_size || 0,
    };
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "Unknown";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)} ${units[i]}`;
}

function buildChannelLink(channelId: string, messageId: number): string {
  const cleanId = channelId.replace(/^-100/, "");
  return `https://t.me/c/${cleanId}/${messageId}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log("Received update:", JSON.stringify(update));

    const message = update.message;
    if (!message) {
      console.log("No message in update, skipping");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = String(message.from?.id);
    const chatId = message.chat.id;

    // Check if user is authorized
    if (!ADMIN_IDS.includes(userId)) {
      console.log(`Unauthorized user: ${userId}`);
      await sendMessage(chatId, "⛔ Unauthorized. You are not allowed to use this bot.");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle /start command
    if (message.text === "/start") {
      await sendMessage(
        chatId,
        "🎬 <b>Cineverse File Bot</b>\n\n" +
          "Send me any file (video, document, audio, photo) and I'll generate stream/download links for you.\n\n" +
          "You'll get:\n" +
          "• 🎬 <b>Stream URL</b> — paste as stream_url for in-app playback\n" +
          "• 📥 <b>Download URL</b> — paste as download_url\n" +
          "• 📢 <b>Channel Link</b> — paste as telegram_url\n\n" +
          "⚠️ Stream/Download URLs only work for files under 20MB (Telegram Bot API limit).\n" +
          "For larger files, use the Channel Link or upload to external hosting."
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for file in message
    const fileInfo = getFileInfo(message);
    if (!fileInfo) {
      await sendMessage(chatId, "📎 Please send me a file (video, document, audio, or photo) to get links.");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward file to channel
    const forwardResult = await forwardMessage(CHANNEL_ID, chatId, message.message_id);

    let channelLink = "❌ Failed to forward";
    if (forwardResult.ok && forwardResult.result?.message_id) {
      channelLink = buildChannelLink(CHANNEL_ID, forwardResult.result.message_id);
    }

    const isSmallFile = fileInfo.fileSize > 0 && fileInfo.fileSize <= 20 * 1024 * 1024;

    // Build stream and download URLs using the proxy
    const streamUrl = `${STREAM_BASE_URL}?file_id=${encodeURIComponent(fileInfo.fileId)}`;
    const downloadUrl = `${STREAM_BASE_URL}?file_id=${encodeURIComponent(fileInfo.fileId)}&download=true&name=${encodeURIComponent(fileInfo.fileName)}`;

    // Build reply message
    let replyText =
      `📁 <b>File Received</b>\n\n` +
      `<b>Name:</b> <code>${fileInfo.fileName}</code>\n` +
      `<b>Size:</b> ${formatFileSize(fileInfo.fileSize)}\n\n`;

    if (isSmallFile) {
      replyText +=
        `🔗 <b>Links:</b>\n\n` +
        `🎬 <b>Stream URL (for stream_url):</b>\n<code>${streamUrl}</code>\n\n` +
        `📥 <b>Download URL (for download_url):</b>\n<code>${downloadUrl}</code>\n\n` +
        `📢 <b>Channel Link (for telegram_url):</b>\n<code>${channelLink}</code>\n\n` +
        `✅ All links are ready! Copy and paste into the admin panel.`;
    } else {
      replyText +=
        `⚠️ <b>File exceeds 20MB — Bot API streaming limit</b>\n\n` +
        `📢 <b>Channel Link (for telegram_url):</b>\n<code>${channelLink}</code>\n\n` +
        `❌ Stream/Download URLs are NOT available for files over 20MB.\n\n` +
        `💡 <b>For large files, you can:</b>\n` +
        `• Upload to Google Drive / Mega and use that URL as stream_url\n` +
        `• Use a direct hosting service for the video file\n` +
        `• The Channel Link is saved for reference`;
    }

    await sendMessage(chatId, replyText);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing update:", error);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
