const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/visitor-count") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": url.origin,
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
          },
        });
      }

      if (request.method === "GET") {
        try {
          await env.DB.prepare(
            "CREATE TABLE IF NOT EXISTS visitor_records (visitor_id TEXT PRIMARY KEY, first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
          ).run();
          const row = await env.DB.prepare(
            "SELECT COUNT(*) AS total FROM visitor_records"
          ).first();
          return json({ total: Number(row?.total || 0) });
        } catch (error) {
          console.error("Visitor count read failed:", error);
          return json({ error: "Visitor counter database is not configured" }, 500);
        }
      }

      if (request.method !== "POST") {
        return json({ error: "Method Not Allowed" }, 405);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const visitorId = String(body?.visitorId || "");
      if (!/^[a-zA-Z0-9-]{8,100}$/.test(visitorId)) {
        return json({ error: "Invalid visitor ID" }, 400);
      }

      try {
        // The primary key makes the count idempotent, even for simultaneous requests.
        await env.DB.prepare(
          "CREATE TABLE IF NOT EXISTS visitor_records (visitor_id TEXT PRIMARY KEY, first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
        ).run();
        await env.DB.prepare(
          "INSERT OR IGNORE INTO visitor_records (visitor_id) VALUES (?)"
        ).bind(visitorId).run();
        const row = await env.DB.prepare(
          "SELECT COUNT(*) AS total FROM visitor_records"
        ).first();
        return json({ total: Number(row?.total || 0) });
      } catch (error) {
        console.error("Visitor counter write failed:", error);
        return json({ error: "Visitor counter database is not configured" }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
