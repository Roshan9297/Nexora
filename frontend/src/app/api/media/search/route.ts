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
    const searchTarget = type === 'song' ? `${q} audio song` : q;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTarget)}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(3500),
    });

    const html = await res.text();
    const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : null;

    if (videoId) {
      return NextResponse.json({
        success: true,
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
        query: q,
        type,
      });
    }

    // Fallback: search-based player embed
    return NextResponse.json({
      success: true,
      videoId: null,
      embedUrl: `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(q)}&autoplay=1`,
      query: q,
      type,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      videoId: null,
      embedUrl: `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(q)}&autoplay=1`,
      query: q,
      type,
      error: err.message,
    });
  }
}
