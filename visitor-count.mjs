import { getStore } from "@netlify/blobs";

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const visitorId = String(body?.visitorId || "").slice(0, 100);
    if (!/^[a-zA-Z0-9-]{8,100}$/.test(visitorId)) {
      return Response.json({ error: "Invalid visitor ID" }, { status: 400 });
    }

    const visitors = getStore("medicine-ds-visitors");
    const key = `visitor:${visitorId}`;
    const existing = await visitors.get(key);
    if (!existing) {
      await visitors.set(key, new Date().toISOString());
    }

    const counter = getStore("medicine-ds-counter");
    const count = await counter.get("total", { type: "json" });
    const total = existing ? Number(count?.total || 0) : Number(count?.total || 0) + 1;
    if (!existing) {
      await counter.setJSON("total", { total, updatedAt: new Date().toISOString() });
    }

    return Response.json({ total }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Visitor counter error:", error);
    return Response.json({ error: "Counter temporarily unavailable" }, { status: 500 });
  }
};
