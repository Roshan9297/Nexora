import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return NextResponse.json({ error: 'Movie query is required' }, { status: 400 });
  }

  // 1. Clean the title: remove conversational prefixes, platform keywords, and generic suffixes
  const cleanTitle = q
    .replace(/^(?:play|watch|stream|show)\s+(?:the\s+)?(?:movie\s+)?/i, '')
    .replace(/\s+(?:on|in|from)\s+(?:netflix|amazon\s*prime|prime\s*video|prime|disney\s*(?:\+|plus)?(?:\s*hotstar)?|hotstar|jiocinema|apple\s*tv|aha)/i, '')
    .replace(/\s+(?:movie|film|cinema)$/i, '')
    .trim();

  let imdbId: string | null = null;
  let tmdbId: string | null = null;
  let movieTitle = cleanTitle;
  let poster: string | null = null;
  let synopsis = '';
  let description = 'Feature Film';
  let wikiTitle: string | null = null;

  // 2. Parallel DuckDuckGo lookups for IMDb ID and TMDB ID
  try {
    const [imdbRes, tmdbRes] = await Promise.allSettled([
      fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanTitle + ' movie imdb')}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(3000),
      }).then((r) => (r.ok ? r.text() : '')),
      fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanTitle + ' movie themoviedb')}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(3000),
      }).then((r) => (r.ok ? r.text() : '')),
    ]);

    if (imdbRes.status === 'fulfilled' && imdbRes.value) {
      const decoded = decodeURIComponent(imdbRes.value);
      const imdbMatches = [...decoded.matchAll(/(?:title|imdb\.com\/title)\/(tt\d{7,8})/g)];
      if (imdbMatches.length > 0) {
        imdbId = imdbMatches[0][1];
      }

      const wikiMatches = [...decoded.matchAll(/en\.wikipedia\.org\/wiki\/([^"&?#\s]+)/g)];
      for (const m of wikiMatches) {
        const slug = decodeURIComponent(m[1]);
        if (
          !/filmography|discography|list_of|awards|actor|actress|director/i.test(slug) &&
          (/\b(?:film|movie)\b/i.test(slug) || /\(\d{4}\)/.test(slug))
        ) {
          wikiTitle = slug;
          break;
        }
      }
    }

    if (tmdbRes.status === 'fulfilled' && tmdbRes.value) {
      const decodedTmdb = decodeURIComponent(tmdbRes.value);
      const tmdbMatch = decodedTmdb.match(/themoviedb\.org\/movie\/(\d+)/);
      if (tmdbMatch) {
        tmdbId = tmdbMatch[1];
      }
    }
  } catch {}

  // 3. Search Wikipedia with multi-candidate scoring based on user query tokens
  if (!wikiTitle) {
    try {
      const wSearch = await fetch(`https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(cleanTitle + ' film')}&limit=8`, {
        headers: { 'User-Agent': 'NexoraAI/1.0 (info@nexora.ai)' },
        signal: AbortSignal.timeout(2500),
      }).then((r) => (r.ok ? r.json() : null));

      const pages = wSearch?.pages || [];
      const queryTokens = cleanTitle.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);

      let bestScore = -1;
      let bestKey: string | null = null;

      for (const p of pages) {
        const text = (p.key + ' ' + (p.description || '')).toLowerCase().replace(/_/g, ' ');

        // Reject non-films
        if (
          text.includes('list of') ||
          text.includes('filmography') ||
          text.includes('discography') ||
          text.includes('production') ||
          (text.includes('actor') && !text.includes('film by')) ||
          (text.includes('actress') && !text.includes('film by')) ||
          text.includes('born 19') ||
          text.includes('born 20')
        ) {
          continue;
        }

        let score = 0;
        if (text.includes('film') || text.includes('movie')) score += 3;
        if (/\(\d{4}\)/.test(p.key)) score += 2;

        for (const token of queryTokens) {
          if (text.includes(token)) score += 2;
        }

        if (score > bestScore) {
          bestScore = score;
          bestKey = p.key;
        }
      }

      if (bestKey) {
        wikiTitle = bestKey;
      }
    } catch {}
  }

  // 4. Fetch Wikipedia summary & wikibase item
  if (wikiTitle) {
    try {
      const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
      const sumRes = await fetch(sumUrl, {
        headers: { 'User-Agent': 'NexoraAI/1.0' },
        signal: AbortSignal.timeout(2500),
      }).then((r) => (r.ok ? r.json() : null));

      if (sumRes) {
        movieTitle = sumRes.title.replace(/\s*\([^)]*film[^)]*\)/i, '').replace(/\s*\(\d{4}\)/i, '').trim();
        poster = sumRes.thumbnail?.source || null;
        synopsis = sumRes.extract || '';
        description = sumRes.description || description;
      }

      if (!imdbId) {
        const propUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(wikiTitle)}&format=json`;
        const propRes = await fetch(propUrl, {
          headers: { 'User-Agent': 'NexoraAI/1.0' },
          signal: AbortSignal.timeout(2000),
        }).then((r) => (r.ok ? r.json() : null));

        const qp = propRes?.query?.pages;
        const page = qp ? Object.values(qp)[0] as any : null;
        const wikibaseItem = page?.pageprops?.wikibase_item;
        if (wikibaseItem) {
          const wdRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikibaseItem}&property=P345&format=json`, {
            headers: { 'User-Agent': 'NexoraAI/1.0' },
            signal: AbortSignal.timeout(2000),
          }).then((r) => (r.ok ? r.json() : null));
          const val = wdRes?.claims?.P345?.[0]?.mainsnak?.datavalue?.value;
          if (val && typeof val === 'string' && val.startsWith('tt')) {
            imdbId = val;
          }
        }
      }
    } catch {}
  }

  return NextResponse.json({
    success: true,
    title: movieTitle,
    cleanTitle,
    description,
    poster,
    synopsis: synopsis || `Stream ${movieTitle} across high-speed digital servers.`,
    imdbId,
    tmdbId,
  });
}
