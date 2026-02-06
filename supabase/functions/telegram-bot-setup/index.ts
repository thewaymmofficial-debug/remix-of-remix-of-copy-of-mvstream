import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BOT_TOKEN = "7684270072:AAGPUfKdSTfk4VCZAie4PsnNKLhebO0hyqA";
const WEBHOOK_URL = "https://icnfjixjohbxjxqbnnac.supabase.co/functions/v1/telegram-bot";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Setting up Telegram webhook...");
    console.log("Webhook URL:", WEBHOOK_URL);

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          allowed_updates: ["message"],
        }),
      }
    );

    const data = await res.json();
    console.log("setWebhook response:", JSON.stringify(data));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error setting webhook:", error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
