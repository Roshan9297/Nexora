import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const type = searchParams.get('type') || 'song';

  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    // 4K Ultra HD video resolution search target
    const searchTarget = type === 'song' ? `${q} 4K UHD official video song` : `${q} 4K UHD`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTarget)}`;

    let res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(3500),
    });

    let html = await res.text();
    let match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    let videoId = match ? match[1] : null;

    // Resilient fallback if specific 4K query returned no direct matches
    if (!videoId) {
      const fallbackTarget = type === 'song' ? `${q} official video song` : q;
      const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(fallbackTarget)}`;
      try {
        const fbRes = await fetch(fallbackUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(3500),
        });
        const fbHtml = await fbRes.text();
        const fbMatch = fbHtml.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        videoId = fbMatch ? fbMatch[1] : null;
      } catch {}
    }

    if (videoId) {
      return NextResponse.json({
        success: true,
        videoId,
        title: q,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&rel=0&controls=0&modestbranding=1&playsinline=1&iv_load_policy=3`,
        query: q,
        type,
        quality: '4K UHD',
      });
    }

    // Fallback: search-based player embed
    return NextResponse.json({
      success: true,
      videoId: null,
      thumbnail: null,
      embedUrl: `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(q)}&enablejsapi=1&controls=0`,
      query: q,
      type,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      videoId: null,
      thumbnail: null,
      embedUrl: `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(q)}&enablejsapi=1&controls=0`,
      query: q,
      type,
      error: err.message,
    });
  }
}
