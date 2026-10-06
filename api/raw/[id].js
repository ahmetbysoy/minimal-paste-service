import { get } from '@vercel/blob';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id || typeof id !== 'string' || id.length < 10) {
      return new Response(JSON.stringify({ ok: false, error: "INVALID_ID" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const blob = await get(`pastes/${id}.json`);
    
    if (!blob) {
      return new Response(JSON.stringify({ ok: false, error: "NOT_FOUND" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const data = JSON.parse(await blob.text());
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);

    // Lazy expiration check
    if (now >= expiresAt) {
      return new Response(JSON.stringify({ ok: false, error: "EXPIRED" }), { 
        status: 410, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    return new Response(data.content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "no-store, max-age=0"
      }
    });

  } catch (error) {
    if (error.message.includes('NOT_FOUND')) {
      return new Response(JSON.stringify({ ok: false, error: "NOT_FOUND" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }
    console.error("Raw fetch error:", error.message);
    return new Response(JSON.stringify({ ok: false, error: "INTERNAL_SERVER_ERROR" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}