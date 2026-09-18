import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return NextResponse.json({ error: 'Movie query is required' }, { status: 400 });
  }

  // Clean the title (e.g. remove "movie", "film", "full movie", "on netflix", etc.)
  const cleanTitle = q
    .replace(/^(?:play|watch|stream|show)\s+(?:the\s+)?(?:movie\s+)?/i, '')
    .replace(/\s+(?:on|in)\s+(?:netflix|amazon\s*prime|prime\s*video|prime|disney\s*(?:\+|plus)?(?:\s*hotstar)?|hotstar|jiocinema|apple\s*tv)/i, '')
    .replace(/\s+(?:movie|film|full movie)$/i, '')
    .trim();

  try {
    // 1. Search Wikipedia for canonical movie page
    const searchUrl = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(cleanTitle + ' film')}&limit=3`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'NexoraAI/1.0 (info@nexora.ai)' },
      signal: AbortSignal.timeout(3000),
    }).then((r) => (r.ok ? r.json() : null));

    const pages = searchRes?.pages || [];
    const bestPage = pages.find((p: any) => /film|movie|\(\d{4}\)/i.test(p.key + ' ' + (p.description || ''))) || pages[0];
    const key = bestPage?.key || cleanTitle;

    // 2. Fetch summary and wikibase pageprops in parallel
    const [summaryRes, propsRes, youtubeSearchRes] = await Promise.allSettled([
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`, {
        headers: { 'User-Agent': 'NexoraAI/1.0 (info@nexora.ai)' },
        signal: AbortSignal.timeout(3000),
      }).then((r) => (r.ok ? r.json() : null)),

      fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(key)}&format=json`, {
        headers: { 'User-Agent': 'NexoraAI/1.0 (info@nexora.ai)' },
        signal: AbortSignal.timeout(3000),
      }).then((r) => (r.ok ? r.json() : null)),

      fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle + ' official trailer')}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(3000),
      }).then((r) => (r.ok ? r.text() : '')),
    ]);

    const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
    const props = propsRes.status === 'fulfilled' ? propsRes.value : null;
    const ytHtml = youtubeSearchRes.status === 'fulfilled' ? youtubeSearchRes.value : '';

    const ytMatch = ytHtml.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    const trailerId = ytMatch ? ytMatch[1] : null;

    // 3. Extract IMDb ID via Wikidata if available
    let imdbId: string | null = null;
    const queryPages = props?.query?.pages;
    const p = queryPages ? Object.values(queryPages)[0] as any : null;
    const wikibaseItem = p?.pageprops?.wikibase_item;

    if (wikibaseItem) {
      try {
        const wdRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikibaseItem}&property=P345&format=json`, {
          signal: AbortSignal.timeout(2000),
        }).then((r) => (r.ok ? r.json() : null));
        imdbId = wdRes?.claims?.P345?.[0]?.mainsnak?.datavalue?.value || null;
      } catch {
        // Fallback without IMDb ID
      }
    }

    const movieTitle = summary?.title || cleanTitle;
    const poster = summary?.thumbnail?.source || null;
    const synopsis = summary?.extract || `Experience the cinematic journey of ${movieTitle}. Watch on digital streaming platforms or stream online.`;
    const description = summary?.description || 'Feature Film';

    // Direct platform deep links
    const platforms = {
      netflix: `https://www.netflix.com/search?q=${encodeURIComponent(movieTitle)}`,
      prime: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(movieTitle)}`,
      hotstar: `https://www.hotstar.com/in/search?q=${encodeURIComponent(movieTitle)}`,
      jiocinema: `https://www.jiocinema.com/search/${encodeURIComponent(movieTitle)}`,
      appletv: `https://tv.apple.com/search?term=${encodeURIComponent(movieTitle)}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(movieTitle + ' full movie')}`,
    };

    return NextResponse.json({
      success: true,
      title: movieTitle,
      cleanTitle,
      description,
      poster,
      synopsis,
      imdbId,
      trailerId,
      platforms,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      title: cleanTitle,
      cleanTitle,
      description: 'Feature Film',
      poster: null,
      synopsis: `Watch ${cleanTitle} on Netflix, Amazon Prime Video, Disney+ Hotstar, and digital platforms.`,
      imdbId: null,
      trailerId: null,
      platforms: {
        netflix: `https://www.netflix.com/search?q=${encodeURIComponent(cleanTitle)}`,
        prime: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(cleanTitle)}`,
        hotstar: `https://www.hotstar.com/in/search?q=${encodeURIComponent(cleanTitle)}`,
        jiocinema: `https://www.jiocinema.com/search/${encodeURIComponent(cleanTitle)}`,
        appletv: `https://tv.apple.com/search?term=${encodeURIComponent(cleanTitle)}`,
        youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle + ' full movie')}`,
      },
    });
  }
}
