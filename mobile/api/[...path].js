// Same-origin proxy to the real HYG.3 API (server/index.ts, deployed at
// hyg3-backend.onrender.com per MVP-LAUNCH-CHECKLIST.md), so this preview
// deployment can talk to the real backend without needing its CORS_ORIGIN
// allowlist updated for a domain nobody there has approved. src/api/client.ts
// points web builds at "/api" by default for exactly this reason.
//
// GET requests that are themselves redirects (the WHOOP OAuth "connect" URL,
// opened as a real browser navigation, not a fetch) are passed through as a
// 302 rather than followed and read as a body.
const BACKEND = 'https://hyg3-backend.onrender.com';

module.exports = async (req, res) => {
  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const url = new URL('/' + segments.join('/'), BACKEND);

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path') continue;
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) if (v != null) url.searchParams.append(key, v);
  }

  const init = {
    method: req.method,
    headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
    redirect: 'manual',
  };
  if (!['GET', 'HEAD'].includes(req.method) && req.body && (typeof req.body !== 'object' || Object.keys(req.body).length)) {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(url.toString(), init);

    if (upstream.status >= 300 && upstream.status < 400 && upstream.headers.get('location')) {
      res.writeHead(upstream.status, { Location: upstream.headers.get('location') });
      res.end();
      return;
    }

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: 'Upstream request failed', detail: String(err) });
  }
};
