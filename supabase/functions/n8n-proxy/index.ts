const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowlist – prevents this from becoming an open proxy
const N8N_ENDPOINTS: Record<string, string> = {
  "client-intake-step1": "https://n8n.link-up.co.il/webhook/client-intake-step1",
  "client-intake-step2": "https://n8n.link-up.co.il/webhook/client-intake-step2",
  "client-intake-final": "https://n8n.link-up.co.il/webhook/client-intake-final",
};

type RequestBody = {
  name?: unknown;
  payload?: unknown;
};

function asEndpointName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const name = v.trim();
  if (!name) return null;
  return name;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const raw = (await req.json()) as RequestBody;
    const name = asEndpointName(raw.name);

    if (!name) {
      return new Response(JSON.stringify({ ok: false, error: "Missing endpoint name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUrl = N8N_ENDPOINTS[name];
    if (!targetUrl) {
      return new Response(JSON.stringify({ ok: false, error: "Endpoint not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(raw.payload ?? {}),
    });

    const upstreamText = await upstream.text();
    console.log("n8n-proxy upstream:", name, upstream.status);

    return new Response(
      JSON.stringify({
        ok: upstream.ok,
        upstream_status: upstream.status,
        upstream_body: upstreamText,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("n8n-proxy error:", error?.message ?? error);
    return new Response(JSON.stringify({ ok: false, error: error?.message ?? "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
