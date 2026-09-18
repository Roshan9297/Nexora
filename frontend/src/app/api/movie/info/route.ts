import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return NextResponse.json({ error: 'Media query is required' }, { status: 400 });
  }

  // Detect requested season and episode if present
  const sMatch = q.match(/(?:season|s)\s*(\d+)/i);
  const eMatch = q.match(/(?:episode|ep)\s*(\d+)/i);
  const requestedSeason = sMatch ? parseInt(sMatch[1], 10) : 1;
  const requestedEpisode = eMatch ? parseInt(eMatch[1], 10) : 1;

  // Clean the title
  const cleanTitle = q
    .replace(/^(?:play|watch|stream|show)\s+(?:the\s+)?(?:movie\s+)?/i, '')
    .replace(/\s+(?:season|s)\s*\d+/i, '')
    .replace(/\s+(?:episode|ep)\s*\d+/i, '')
    .replace(/\s+(?:on|in|from)\s+(?:netflix|amazon\s*prime|prime\s*video|prime|disney\s*(?:\+|plus)?(?:\s*hotstar)?|hotstar|jiocinema|apple\s*tv|aha|crunchyroll)/i, '')
    .replace(/\s+(?:movie|film|anime|series|show|tv\s*series|web\s*series)$/i, '')
    .trim();

  let imdbId: string | null = null;
  let tmdbId: string | null = null;
  let mediaType: 'movie' | 'series' = 'movie';
  let movieTitle = cleanTitle;
  let poster: string | null = null;
  let synopsis = '';
  let description = '';
  let wikiTitle: string | null = null;

  const isExplicitSeries = /\b(?:anime|series|season|episode|show|drama|k-drama|kdrama|tv)\b/i.test(q);

  // 0. Query IMDb Suggestions API for ultra-fast canonical IMDb ID and media type
  try {
    const cleanSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const firstChar = cleanSlug[0] || 'a';
    const imdbSuggRes = await fetch(`https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(cleanSlug)}.json`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(2000),
    }).then((r) => (r.ok ? r.json() : null));

    const items: any[] = imdbSuggRes?.d || [];
    const bestImdb = isExplicitSeries
      ? items.find((x) => x.id?.startsWith('tt') && /TV series|mini-series|series/i.test(x.q || '')) || items.find((x) => x.id?.startsWith('tt'))
      : items.find((x) => x.id?.startsWith('tt') && !/TV series|mini-series/i.test(x.q || '')) || items.find((x) => x.id?.startsWith('tt'));

    if (bestImdb) {
      imdbId = bestImdb.id;
      if (/TV series|mini-series|series/i.test(bestImdb.q || '')) {
        mediaType = 'series';
      }
      if (bestImdb.i?.imageUrl && !poster) {
        poster = bestImdb.i.imageUrl;
      }
    }
  } catch {}

  // 1. Search DuckDuckGo for IMDb and TMDB with safe decoding (if not already resolved)
  try {
    const searchParam = isExplicitSeries ? `${cleanTitle} tv series imdb` : `${cleanTitle} movie imdb`;
    const tmdbParam = isExplicitSeries ? `${cleanTitle} tv series themoviedb` : `${cleanTitle} movie themoviedb`;

    const [imdbRes, tmdbRes] = await Promise.allSettled([
      !imdbId
        ? fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchParam)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(3000),
          }).then((r) => (r.ok ? r.text() : ''))
        : Promise.resolve(''),
      fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(tmdbParam)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(3000),
      }).then((r) => (r.ok ? r.text() : '')),
    ]);

    if (!imdbId && imdbRes.status === 'fulfilled' && imdbRes.value) {
      const val = imdbRes.value;
      const imdbMatch = val.match(/title(?:%2F|\/)(tt\d{7,8})/i) || safeDecode(val).match(/title\/(tt\d{7,8})/i);
      if (imdbMatch) imdbId = imdbMatch[1];
    }

    if (tmdbRes.status === 'fulfilled' && tmdbRes.value) {
      const valTmdb = tmdbRes.value;
      const tmdbTv = valTmdb.match(/themoviedb\.org(?:%2F|\/)tv(?:%2F|\/)(\d+)/i) || safeDecode(valTmdb).match(/themoviedb\.org\/tv\/(\d+)/i);
      const tmdbMovie = valTmdb.match(/themoviedb\.org(?:%2F|\/)movie(?:%2F|\/)(\d+)/i) || safeDecode(valTmdb).match(/themoviedb\.org\/movie\/(\d+)/i);
      if (tmdbTv) {
        tmdbId = tmdbTv[1];
        mediaType = 'series';
      } else if (tmdbMovie) {
        tmdbId = tmdbMovie[1];
      }
    }
  } catch {}

  if (isExplicitSeries) mediaType = 'series';

  // 2. Search Wikipedia for canonical details
  try {
    const wikiQuery = isExplicitSeries ? `${cleanTitle} TV series` : `${cleanTitle} film`;
    const wSearch = await fetch(`https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(wikiQuery)}&limit=6`, {
      headers: { 'User-Agent': 'NexoraAI/1.0 (info@nexora.ai)' },
      signal: AbortSignal.timeout(2500),
    }).then((r) => (r.ok ? r.json() : null));

    const pages = wSearch?.pages || [];
    const best =
      pages.find((p: any) => /_(?:tv_series|series|anime)$/i.test(p.key)) ||
      pages.find((p: any) => !/filmography|list_of|franchise|discography/i.test(p.key)) ||
      pages[0];

    if (best) {
      wikiTitle = best.key;
      const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle || '')}`;
      const sumRes = await fetch(sumUrl, {
        headers: { 'User-Agent': 'NexoraAI/1.0' },
        signal: AbortSignal.timeout(2500),
      }).then((r) => (r.ok ? r.json() : null));

      if (sumRes) {
        movieTitle = sumRes.title.replace(/\s*\([^)]*(?:film|series|anime|manga|season)[^)]*\)/i, '').trim();
        poster = poster || sumRes.thumbnail?.source || null;
        synopsis = sumRes.extract || '';
        description = sumRes.description || (mediaType === 'series' ? 'Anime / TV Series' : 'Feature Film');

        if (/anime|television series|tv series|animated series|manga/i.test(description + ' ' + synopsis)) {
          mediaType = 'series';
        }
      }

      // If still missing IMDb ID or TMDB ID, check wikibase item
      if (!imdbId || !tmdbId) {
        const propUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(wikiTitle || '')}&format=json`;
        const propRes = await fetch(propUrl, {
          headers: { 'User-Agent': 'NexoraAI/1.0' },
          signal: AbortSignal.timeout(2000),
        }).then((r) => (r.ok ? r.json() : null));

        const qp = propRes?.query?.pages;
        const page = qp ? Object.values(qp)[0] as any : null;
        const wikibaseItem = page?.pageprops?.wikibase_item;
        if (wikibaseItem) {
          const [wdP345, wdTmdbTv, wdTmdbMovie] = await Promise.allSettled([
            !imdbId
              ? fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikibaseItem}&property=P345&format=json`, {
                  headers: { 'User-Agent': 'NexoraAI/1.0' },
                  signal: AbortSignal.timeout(2000),
                }).then((r) => (r.ok ? r.json() : null))
              : Promise.resolve(null),
            !tmdbId
              ? fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikibaseItem}&property=P4983&format=json`, {
                  headers: { 'User-Agent': 'NexoraAI/1.0' },
                  signal: AbortSignal.timeout(2000),
                }).then((r) => (r.ok ? r.json() : null))
              : Promise.resolve(null),
            !tmdbId
              ? fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikibaseItem}&property=P4947&format=json`, {
                  headers: { 'User-Agent': 'NexoraAI/1.0' },
                  signal: AbortSignal.timeout(2000),
                }).then((r) => (r.ok ? r.json() : null))
              : Promise.resolve(null),
          ]);

          if (!imdbId && wdP345.status === 'fulfilled' && wdP345.value) {
            const val = wdP345.value?.claims?.P345?.[0]?.mainsnak?.datavalue?.value;
            if (val && typeof val === 'string' && val.startsWith('tt')) imdbId = val;
          }

          if (!tmdbId && mediaType === 'series' && wdTmdbTv.status === 'fulfilled' && wdTmdbTv.value) {
            const val = wdTmdbTv.value?.claims?.P4983?.[0]?.mainsnak?.datavalue?.value;
            if (val) tmdbId = String(val);
          } else if (!tmdbId && wdTmdbMovie.status === 'fulfilled' && wdTmdbMovie.value) {
            const val = wdTmdbMovie.value?.claims?.P4947?.[0]?.mainsnak?.datavalue?.value;
            if (val) tmdbId = String(val);
          }
        }
      }
    }
  } catch {}

  return NextResponse.json({
    success: true,
    title: movieTitle,
    cleanTitle,
    mediaType,
    description: description || (mediaType === 'series' ? 'Anime / TV Series' : 'Feature Film'),
    poster,
    synopsis: synopsis || `Stream ${movieTitle} across high-speed digital servers.`,
    imdbId,
    tmdbId,
    requestedSeason,
    requestedEpisode,
  });
}
