const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://n8n.chasida.biz/webhook/sendGmail";

type Payload = {
  client_name?: unknown;
  phone?: unknown;
  email?: unknown;
  business_count?: unknown;
  business_name?: unknown;
  business_type?: unknown;
  business_type_label?: unknown;
  formatted_text?: unknown;
};

function asString(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
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
    const raw = (await req.json()) as Payload;

    // Validate & normalize (minimal, no PII logging)
    const payload = {
      client_name: asString(raw.client_name, 200),
      phone: asString(raw.phone, 50),
      email: asString(raw.email, 255),
      business_count: asNumber(raw.business_count) ?? 0,
      business_name: asString(raw.business_name, 200),
      business_type: asString(raw.business_type, 50),
      business_type_label: asString(raw.business_type_label, 50),
      formatted_text: asString(raw.formatted_text, 4000),
    };

    // basic sanity check: require at least one contact method
    if (!payload.phone && !payload.email) {
      return new Response(JSON.stringify({ ok: false, error: "Missing phone/email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const upstreamText = await upstream.text();
    console.log("send-gmail-proxy upstream status:", upstream.status);

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
    console.error("send-gmail-proxy error:", error?.message ?? error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

