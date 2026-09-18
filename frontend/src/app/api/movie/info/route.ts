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
  let movieTitle = cleanTitle;
  let poster: string | null = null;
  let synopsis = '';
  let description = 'Feature Film';
  let wikiTitle: string | null = null;

  // 2. DuckDuckGo search to extract IMDb ID and canonical Wikipedia link
  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanTitle + ' movie site:imdb.com OR site:en.wikipedia.org')}`;
    const ddgRes = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (ddgRes.ok) {
      const ddgRaw = await ddgRes.text();
      const ddgHtml = decodeURIComponent(ddgRaw);

      // Extract IMDb ID (tt followed by 7-8 digits only; discard nm actor IDs)
      const imdbMatches = [...ddgHtml.matchAll(/(?:title|imdb\.com\/title)\/(tt\d{7,8})/g)];
      if (imdbMatches.length > 0) {
        imdbId = imdbMatches[0][1];
      }

      // Extract Wikipedia movie link if present (skip person/actor pages)
      const wikiMatches = [...ddgHtml.matchAll(/en\.wikipedia\.org\/wiki\/([^"&?#\s]+)/g)];
      for (const m of wikiMatches) {
        const slug = decodeURIComponent(m[1]);
        if (
          !/filmography|discography|list_of|awards|actor|actress|director|producer/i.test(slug) &&
          (/\b(?:film|movie)\b/i.test(slug) || /\(\d{4}\)/.test(slug))
        ) {
          wikiTitle = slug;
          break;
        }
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
        const keyLower = p.key.toLowerCase();
        const descLower = (p.description || '').toLowerCase();
        const combined = `${keyLower} ${descLower}`;

        const cleanText = combined.replace(/_/g, ' ');
        if (
          cleanText.includes('list of') ||
          cleanText.includes('filmography') ||
          cleanText.includes('discography') ||
          cleanText.includes('production') ||
          (cleanText.includes('actor') && !cleanText.includes('film by')) ||
          (cleanText.includes('actress') && !cleanText.includes('film by')) ||
          cleanText.includes('born 19') ||
          cleanText.includes('born 20')
        ) {
          continue;
        }

        let score = 0;
        if (combined.includes('film') || combined.includes('movie')) score += 3;
        if (/\(\d{4}\)/.test(p.key)) score += 2;

        for (const token of queryTokens) {
          if (combined.includes(token)) score += 2;
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

  // 4. If we have an IMDb ID but still no wikiTitle, reverse lookup via Wikidata
  if (imdbId && !wikiTitle) {
    try {
      const wdUrl = `https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=haswbstatement:P345=${imdbId}&format=json`;
      const wdRes = await fetch(wdUrl, {
        headers: { 'User-Agent': 'NexoraAI/1.0' },
        signal: AbortSignal.timeout(2500),
      }).then((r) => (r.ok ? r.json() : null));

      const entityId = wdRes?.query?.search?.[0]?.title;
      if (entityId) {
        const entUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=labels|descriptions|sitelinks/urls&languages=en&format=json`;
        const entRes = await fetch(entUrl, {
          headers: { 'User-Agent': 'NexoraAI/1.0' },
          signal: AbortSignal.timeout(2500),
        }).then((r) => (r.ok ? r.json() : null));

        const ent = entRes?.entities?.[entityId];
        if (ent) {
          if (ent.labels?.en?.value) movieTitle = ent.labels.en.value;
          if (ent.descriptions?.en?.value) description = ent.descriptions.en.value;
          if (ent.sitelinks?.enwiki?.title) wikiTitle = ent.sitelinks.enwiki.title;
        }
      }
    } catch {}
  }

  // 5. Fetch Wikipedia summary & wikibase item
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

  // 6. Query YouTube in parallel for both the FULL MOVIE stream and official trailer
  const [fullMovieRes, trailerRes] = await Promise.allSettled([
    fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle + ' full movie')}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(3000),
    }).then((r) => (r.ok ? r.text() : '')),
    fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(movieTitle + ' official trailer')}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(3000),
    }).then((r) => (r.ok ? r.text() : '')),
  ]);

  let fullMovieId: string | null = null;
  if (fullMovieRes.status === 'fulfilled' && fullMovieRes.value) {
    const m = fullMovieRes.value.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (m) fullMovieId = m[1];
  }

  let trailerId: string | null = null;
  if (trailerRes.status === 'fulfilled' && trailerRes.value) {
    const m = trailerRes.value.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (m) trailerId = m[1];
  }

  // Direct platform deep links
  const platforms = {
    netflix: `https://www.netflix.com/search?q=${encodeURIComponent(movieTitle)}`,
    prime: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(movieTitle)}`,
    hotstar: `https://www.hotstar.com/in/search?q=${encodeURIComponent(movieTitle)}`,
    jiocinema: `https://www.jiocinema.com/search/${encodeURIComponent(movieTitle)}`,
    aha: `https://www.aha.video/search?q=${encodeURIComponent(movieTitle)}`,
    appletv: `https://tv.apple.com/search?term=${encodeURIComponent(movieTitle)}`,
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(movieTitle + ' full movie')}`,
  };

  return NextResponse.json({
    success: true,
    title: movieTitle,
    cleanTitle,
    description,
    poster,
    synopsis: synopsis || `Stream ${movieTitle} in HD directly or launch across official OTT platforms.`,
    imdbId,
    fullMovieId,
    trailerId,
    platforms,
  });
}
