import { getStore } from '@netlify/blobs';

const VALID_FILES = ['arm64', 'x64'];

export default async (req) => {
  const url = new URL(req.url);
  const file = url.searchParams.get('file');

  if (!VALID_FILES.includes(file)) {
    return new Response(JSON.stringify({ error: 'invalid file' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = getStore('downloads');

  if (req.method === 'POST') {
    const current = parseInt(await store.get(file) ?? '0', 10);
    const next = current + 1;
    await store.set(file, String(next));
    return new Response(JSON.stringify({ count: next }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET — return both counts
  const [arm64, x64] = await Promise.all([
    store.get('arm64').then(v => parseInt(v ?? '0', 10)),
    store.get('x64').then(v => parseInt(v ?? '0', 10)),
  ]);

  return new Response(JSON.stringify({ arm64, x64, total: arm64 + x64 }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = { path: '/api/download-count' };
