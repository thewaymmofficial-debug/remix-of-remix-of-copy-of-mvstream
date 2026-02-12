import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

interface SourceEntry {
  url: string;
  enabled: boolean;
}

interface SourceResult {
  category: string;
  channels: Record<string, GitHubChannel[]>;
}

// Cache keyed on source URLs hash
let cache: { data: any; urlsHash: string; timestamp: number } = {
  data: null,
  urlsHash: "",
  timestamp: 0,
};
const CACHE_TTL = 5 * 60 * 1000;

function parseCategoryFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    // Find the last segment (filename) and take the two before it
    if (segments.length >= 3) {
      const type = segments[segments.length - 3]; // e.g. "LiveTV", "Movies"
      const country = segments[segments.length - 2]; // e.g. "Arabic", "Thailand"
      const formattedType = type.replace(/([a-z])([A-Z])/g, "$1 $2"); // "LiveTV" -> "Live TV"
      return `${formattedType} - ${country}`;
    }
    if (segments.length >= 2) {
      const type = segments[segments.length - 2];
      const formattedType = type.replace(/([a-z])([A-Z])/g, "$1 $2");
      return formattedType;
    }
    return "Other";
  } catch {
    return "Other";
  }
}

async function fetchSources(): Promise<SourceEntry[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "live_tv_sources")
    .single();

  if (error || !data?.value) {
    return [
      {
        url: "https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV/Arabic/LiveTV.json",
        enabled: true,
      },
    ];
  }

  try {
    const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return (parsed as SourceEntry[]).filter((s) => s.enabled);
  } catch {
    return [];
  }
}

async function fetchAllSources(
  sources: SourceEntry[]
): Promise<Record<string, SourceResult>> {
  const urlsHash = sources.map((s) => s.url).sort().join("|");
  const now = Date.now();

  if (cache.data && cache.urlsHash === urlsHash && now - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const results: Record<string, SourceResult> = {};

  const fetches = await Promise.allSettled(
    sources.map(async (source) => {
      const category = parseCategoryFromUrl(source.url);
      const res = await fetch(source.url);
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = (await res.json()) as GitHubResponse;
      return { category, channels: json.channels || {} };
    })
  );

  for (const result of fetches) {
    if (result.status === "fulfilled") {
      const { category, channels } = result.value;
      results[category] = { category, channels };
    }
  }

  cache = { data: results, urlsHash, timestamp: now };
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sources = await fetchSources();
    const data = await fetchAllSources(sources);

    return new Response(
      JSON.stringify({ date: new Date().toISOString(), sources: data }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      }
    );
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
