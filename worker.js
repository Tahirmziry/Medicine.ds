const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

async function ensureTable(db) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS visitor_records (visitor_id TEXT PRIMARY KEY, first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
  ).run();
}

async function getCount(db) {
  await ensureTable(db);
  const row = await db.prepare("SELECT COUNT(*) AS total FROM visitor_records").first();
  const total = Number(row?.total || 0);
  // Return both field names to remain compatible with earlier counter versions.
  return { success: true, total_visits: total, total };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isCounterRoute = url.pathname === "/" || url.pathname === "/api/visitor-count";

    if (request.method === "OPTIONS" && isCounterRoute) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (isCounterRoute && request.method === "GET") {
      try {
        return json(await getCount(env.DB));
      } catch (error) {
        console.error("Visitor count read failed:", error);
        return json({ success: false, error: "Visitor counter database is not configured" }, 500);
      }
    }

    if (isCounterRoute && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ success: false, error: "Invalid JSON" }, 400);
      }

      const visitorId = String(body?.visitorId || "");
      if (!/^[a-zA-Z0-9-]{8,100}$/.test(visitorId)) {
        return json({ success: false, error: "Invalid visitor ID" }, 400);
      }

      try {
        await ensureTable(env.DB);
        // A stable browser ID is counted only once; repeated refreshes do not inflate totals.
        await env.DB.prepare(
          "INSERT OR IGNORE INTO visitor_records (visitor_id) VALUES (?)"
        ).bind(visitorId).run();
        return json(await getCount(env.DB));
      } catch (error) {
        console.error("Visitor count write failed:", error);
        return json({ success: false, error: "Visitor counter database is not configured" }, 500);
      }
    }

    if (isCounterRoute) return json({ success: false, error: "Method Not Allowed" }, 405);
    return json({ success: false, error: "Not Found" }, 404);
  },
};
