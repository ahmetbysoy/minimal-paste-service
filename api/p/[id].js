import { get } from '@vercel/blob';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!id || typeof id !== 'string' || id.length < 10) {
      return new Response("Invalid ID", { status: 400, headers: { "Content-Type": "text/plain" } });
    }

    const blob = await get(`pastes/${id}.json`);
    if (!blob) {
      return new Response("Paste not found", { status: 404, headers: { "Content-Type": "text/plain" } });
    }

    const data = JSON.parse(await blob.text());
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);

    if (now >= expiresAt) {
      return new Response("Paste has expired", { status: 410, headers: { "Content-Type": "text/plain" } });
    }

    // STRICT XSS PROTECTION: Escape all HTML
    const escapeHtml = (unsafe) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeContent = escapeHtml(data.content);
    const createdAt = new Date(data.createdAt).toLocaleString();
    const expiresAtStr = expiresAt.toLocaleString();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paste: ${id}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0d1117; color: #c9d1d9; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .container { width: 100%; max-width: 800px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 20px; }
        .meta { color: #8b949e; font-size: 14px; margin-bottom: 15px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .content { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 15px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 14px; line-height: 1.5; color: #e6edf3; }
        .actions { margin-top: 20px; display: flex; gap: 10px; }
        button { background: #238636; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; }
        button:hover { background: #2ea043; }
        button.secondary { background: #21262d; border: 1px solid #30363d; }
        button.secondary:hover { background: #30363d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="meta">
            <span>Created: ${createdAt}</span>
            <span>Expires: ${expiresAtStr}</span>
        </div>
        <div class="content" id="paste-content">${safeContent}</div>
        <div class="actions">
            <button onclick="copyRaw()">Copy Raw Text</button>
            <button class="secondary" onclick="window.location.href='/raw/${id}'">View Raw</button>
            <button class="secondary" onclick="window.location.href='/'">New Paste</button>
        </div>
    </div>
    <script>
        function copyRaw() {
            const text = document.getElementById('paste-content').innerText;
            navigator.clipboard.writeText(text).then(() => {
                const btn = event.target;
                const orig = btn.textContent;
                btn.textContent = "COPIED!";
                setTimeout(() => btn.textContent = orig, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
    </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
        "X-Frame-Options": "DENY"
      }
    });

  } catch (error) {
    if (error.message.includes('NOT_FOUND')) {
      return new Response("Paste not found", { status: 404, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Internal Server Error", { status: 500, headers: { "Content-Type": "text/plain" } });
  }
}