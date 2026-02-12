import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SOURCES = [
  "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/Arabic/LiveTV.json",
];

interface GitHubChannel {
  name: string;
  logo: string;
  url: string;
  group: string;
  source?: string;
}

interface GitHubResponse {
  date?: string;
  channels?: Record<string, GitHubChannel[]>;
}

// Simple in-memory cache
let cache: { data: GitHubResponse | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchAndMergeSources(sourceUrls: string[]): Promise<GitHubResponse> {
  const now = Date.now();

  // Return cache if still valid
  if (cache.data && now - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const mergedChannels: Record<string, GitHubChannel[]> = {};

  const results = await Promise.allSettled(
    sourceUrls.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      return (await res.json()) as GitHubResponse;
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value?.channels) {
      for (const [category, channels] of Object.entries(result.value.channels)) {
        if (!mergedChannels[category]) {
          mergedChannels[category] = [];
        }
        mergedChannels[category].push(...channels);
      }
    }
  }

  const response: GitHubResponse = {
    date: new Date().toISOString(),
    channels: mergedChannels,
  };

  // Update cache
  cache = { data: response, timestamp: now };

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sourcesParam = url.searchParams.get("sources");
    const sourceUrls = sourcesParam
      ? sourcesParam.split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_SOURCES;

    const data = await fetchAndMergeSources(sourceUrls);

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("live-tv-proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch TV channels" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
