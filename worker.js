const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tahirmziry.github.io",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === "/api/visit" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
      const visitorId = String(body.visitorId || "");
      if (!/^[a-zA-Z0-9-]{8,80}$/.test(visitorId)) return json({ error: "Invalid visitor ID" }, 400);

      const now = new Date();
      const day = now.toISOString().slice(0, 10);
      await env.DB.prepare(
        "INSERT INTO visitors (visitor_id, first_seen, last_seen) VALUES (?, ?, ?) " +
        "ON CONFLICT(visitor_id) DO UPDATE SET last_seen = excluded.last_seen"
      ).bind(visitorId, now.toISOString(), now.toISOString()).run();

      await env.DB.prepare(
        "INSERT OR IGNORE INTO visits (visitor_id, visit_date) VALUES (?, ?)"
      ).bind(visitorId, day).run();

      return json({ ok: true });
    }

    if (url.pathname === "/api/stats" && request.method === "GET") {
      const total = await env.DB.prepare("SELECT COUNT(*) AS n FROM visitors").first();
      const today = await env.DB.prepare(
        "SELECT COUNT(DISTINCT visitor_id) AS n FROM visits WHERE visit_date = date('now')"
      ).first();
      const week = await env.DB.prepare(
        "SELECT COUNT(DISTINCT visitor_id) AS n FROM visits WHERE visit_date >= date('now', '-6 days')"
      ).first();
      const month = await env.DB.prepare(
        "SELECT COUNT(DISTINCT visitor_id) AS n FROM visits WHERE visit_date >= date('now', 'start of month')"
      ).first();

      return json({
        total: total?.n || 0,
        today: today?.n || 0,
        week: week?.n || 0,
        month: month?.n || 0
      });
    }

    return json({ error: "Not found" }, 404);
  }
};
