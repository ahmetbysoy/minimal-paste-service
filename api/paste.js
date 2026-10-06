import { put } from '@vercel/blob';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({ ok: false, error: "INVALID_CONTENT_TYPE" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const body = await request.json();
    const content = body.content;

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: "EMPTY_OR_INVALID_CONTENT" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    if (content.trim().length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "PASTE_CANNOT_BE_EMPTY" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Strict byte size check (UTF-8)
    const byteSize = Buffer.byteLength(content, 'utf8');
    if (byteSize > MAX_SIZE_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "PAYLOAD_TOO_LARGE", limit: "5 MiB" }), { 
        status: 413, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Secure, unguessable ID generation
    const randomBytes = new Uint8Array(9);
    crypto.getRandomValues(randomBytes);
    const id = Buffer.from(randomBytes).toString('base64url');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const metadata = {
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      byteSize: byteSize
    };

    const blob = await put(`pastes/${id}.json`, JSON.stringify({ content, ...metadata }), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json'
    });

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : request.headers.get('origin') || '';

    return new Response(JSON.stringify({
      ok: true,
      id: id,
      url: `${baseUrl}/p/${id}`,
      rawUrl: `${baseUrl}/raw/${id}`,
      expiresAt: expiresAt.toISOString()
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Paste creation error:", error.message);
    return new Response(JSON.stringify({ ok: false, error: "INTERNAL_SERVER_ERROR" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}