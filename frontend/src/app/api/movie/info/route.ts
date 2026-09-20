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

  const isExplicitSeries = /\b(?:anime|series|season|episode|ep|show|drama|k-drama|kdrama|tv|web\s*series|animation)\b/i.test(q);

  // Extract core title and clean descriptors cleanly
  let cleanTitle = q
    .replace(/^(?:play|watch|stream|show)\s+(?:the\s+)?/i, '')
    .replace(/\s+(?:season|s)\s*\d+/gi, '')
    .replace(/\s+(?:episode|ep)\s*\d+/gi, '')
    .replace(/\b(?:on|in|from)\s+(?:netflix|amazon\s*prime|prime\s*video|prime|disney\s*(?:\+|plus)?(?:\s*hotstar)?|hotstar|jiocinema|apple\s*tv|aha|crunchyroll)\b/gi, '')
    .trim();

  // Strip dub/sub and language specifications (e.g. "in english", "in japanese", "english dub", "telugu dubbed")
  cleanTitle = cleanTitle
    .replace(/\b(?:in|with)\s+(?:japanese|korean|english|hindi|telugu|tamil|malayalam|kannada|bengali|marathi|spanish|french|german|italian|chinese|mandarin|turkish|arabic|russian)\b/gi, '')
    .replace(/\b(?:japanese|korean|english|hindi|telugu|tamil|malayalam|kannada|bengali|marathi|spanish|french|german|italian|chinese|mandarin|turkish|arabic|russian)\s+(?:dub|dubbed|sub|subbed|audio|language)\b/gi, '')
    .replace(/\b(?:english|eng|hindi|telugu|tamil|jap|japanese)\s*(?:sub|dub)\b/gi, '');

  // Strip category keywords when used as descriptors (e.g. "korean series", "anime", "web series", "tv series", "full movie")
  cleanTitle = cleanTitle
    .replace(/\b(?:japanese|korean|hindi|telugu|tamil|malayalam|kannada|spanish|french|german)\s+(?:series|web\s*series|tv\s*series|movie|film|cinema|show|drama)\b/gi, '')
    .replace(/\b(?:web\s*series|tv\s*series|tv\s*show|full\s*movie|k-drama|kdrama)\b/gi, '')
    .replace(/\b(?:anime|series|show|drama|movie|film|cinema)\b/gi, '');

  // Strip known actor names
  const actorRegex = /\b(prabhas|allu\s+arjun|mahesh\s+babu|chiranjeevi|ntr|ram\s+charan|pawan\s+kalyan|vijay|ajith|rajinikanth|kamal\s+haasan|srk|salman|shah\s*rukh|aamir|varun\s+tej)\b/gi;
  const hints = cleanTitle.match(actorRegex) || [];
  let coreTitle = cleanTitle.replace(actorRegex, '');

  // Strip trailing language tag if at the very end
  coreTitle = coreTitle.replace(/\s+\b(telugu|tamil|hindi|kannada|malayalam|japanese|korean|english|spanish|german)\s*$/gi, '');
  coreTitle = coreTitle.replace(/\s+/g, ' ').trim();

  if (!coreTitle || coreTitle.length < 2) {
    coreTitle = cleanTitle;
  }

  let imdbId: string | null = null;
  let tmdbId: string | null = null;
  let fallbackImdb: any = null;
  let mediaType: 'movie' | 'series' | 'song' = isExplicitSeries ? 'series' : 'movie';
  let movieTitle = coreTitle;
  let poster: string | null = null;
  let synopsis = '';
  let description = '';
  let wikiTitle: string | null = null;

  // 0. Query IMDb Suggestions API for ultra-fast canonical IMDb ID and media type
  try {
    const cleanSlug = coreTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const firstChar = cleanSlug[0] || 'a';
    const imdbSuggRes = await fetch(`https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(cleanSlug)}.json`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(2500),
    }).then((r) => (r.ok ? r.json() : null));

    const items: any[] = imdbSuggRes?.d || [];
    // Prioritize feature film or TV series, strictly excluding video games and podcasts
    const validItems = items.filter((x) => x.id?.startsWith('tt') && !/video game|podcast/i.test(x.q || ''));

    // 1. Check for exact title match first
    const exactMatch = isExplicitSeries
      ? validItems.find((x) => x.l?.toLowerCase() === coreTitle.toLowerCase() && /TV series|mini-series|series|tvSeries|tvMiniSeries/i.test(x.q || x.qid || '')) ||
        validItems.find((x) => x.l?.toLowerCase() === coreTitle.toLowerCase())
      : validItems.find((x) => x.l?.toLowerCase() === coreTitle.toLowerCase() && !/TV series|mini-series/i.test(x.q || x.qid || '')) ||
        validItems.find((x) => x.l?.toLowerCase() === coreTitle.toLowerCase());

    const bestImdb = exactMatch || (isExplicitSeries
      ? validItems.find((x) => /TV series|mini-series|series|tvSeries|tvMiniSeries/i.test(x.q || x.qid || '')) || validItems[0]
      : validItems.find((x) => /feature|movie|film/i.test(x.q || x.qid || '')) ||
        validItems.find((x) => !/TV series|mini-series/i.test(x.q || '')) ||
        validItems[0]);

    fallbackImdb = null;
    const matchesHint = hints.length === 0 || hints.some((h) => 
      (bestImdb?.s || '').toLowerCase().includes(h.toLowerCase()) || 
      (bestImdb?.l || '').toLowerCase().includes(h.toLowerCase())
    );

    if (bestImdb && matchesHint) {
      imdbId = bestImdb.id;
      if (/TV series|mini-series|series|tvSeries|tvMiniSeries/i.test(bestImdb.q || bestImdb.qid || '')) {
        mediaType = 'series';
      }
      if (bestImdb.i?.imageUrl && !poster) {
        poster = bestImdb.i.imageUrl;
      }
      if (bestImdb.l) {
        movieTitle = bestImdb.l;
      }

      // Fast reverse lookup on Wikidata using P345 (IMDb ID) to find TMDb TV / Movie ID
      try {
        const wdSearch = await fetch(`https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=haswbstatement:P345=${imdbId}&format=json`, {
          headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
          signal: AbortSignal.timeout(2500),
        }).then((r) => (r.ok ? r.json() : null));

        const entityId = wdSearch?.query?.search?.[0]?.title;
        if (entityId) {
          const claimsRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&format=json`, {
            headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
            signal: AbortSignal.timeout(2000),
          }).then((r) => (r.ok ? r.json() : null));

          const claims = claimsRes?.claims;
          if (mediaType === 'series' && claims?.P4983?.[0]?.mainsnak?.datavalue?.value) {
            tmdbId = String(claims.P4983[0].mainsnak.datavalue.value);
          } else if (claims?.P4947?.[0]?.mainsnak?.datavalue?.value) {
            tmdbId = String(claims.P4947[0].mainsnak.datavalue.value);
          } else if (claims?.P4983?.[0]?.mainsnak?.datavalue?.value) {
            tmdbId = String(claims.P4983[0].mainsnak.datavalue.value);
            mediaType = 'series';
          }
        }
      } catch {}
    } else if (bestImdb) {
      fallbackImdb = bestImdb;
    }
  } catch {}

  // 1. Search Wikipedia for canonical details and fallback IDs if still incomplete
  try {
    const wikiQuery = isExplicitSeries || mediaType === 'series'
      ? `${coreTitle} ${hints.join(' ')} TV series anime`
      : `${coreTitle} ${hints.join(' ')} film`;

    const wSearch = await fetch(`https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(wikiQuery.trim())}&limit=7`, {
      headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
      signal: AbortSignal.timeout(2500),
    }).then((r) => (r.ok ? r.json() : null));

    const pages = wSearch?.pages || [];
    // Prioritize actual films/series, specifically avoiding pages about actors/actresses
    const best =
      pages.find((p: any) => /film|movie|series|anime/i.test(p.key + ' ' + (p.description || '')) && !/actor|actress|discography|filmography|list_of/i.test(p.description || '')) ||
      pages.find((p: any) => !/actor|actress|discography|filmography|list_of/i.test(p.description || '')) ||
      pages[0];

    if (best) {
      wikiTitle = best.key;
      const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle || '')}`;
      const sumRes = await fetch(sumUrl, {
        headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
        signal: AbortSignal.timeout(2500),
      }).then((r) => (r.ok ? r.json() : null));

      if (sumRes) {
        if (!movieTitle || movieTitle === cleanTitle) {
          movieTitle = sumRes.title.replace(/\s*\([^)]*(?:film|series|anime|manga|season)[^)]*\)/i, '').trim();
        }
        poster = poster || sumRes.thumbnail?.source || null;
        synopsis = synopsis || sumRes.extract || '';
        description = description || sumRes.description || (mediaType === 'series' ? 'Anime / TV Series' : 'Feature Film');

        if (/anime|television series|tv series|animated series/i.test((sumRes.description || '') + ' ' + (sumRes.extract || ''))) {
          mediaType = 'series';
        } else if (/\b(?:song|single|music\s*video|track|recording\s*by|studio\s*album)\b/i.test((sumRes.description || '') + ' ' + (sumRes.extract || ''))) {
          mediaType = 'song';
        }
      }

      // Check Wikipedia external links directly for IMDb ID if not yet resolved
      if (!imdbId) {
        try {
          const extUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extlinks&titles=${encodeURIComponent(wikiTitle || '')}&elquery=imdb.com&format=json`;
          const extRes = await fetch(extUrl, {
            headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
            signal: AbortSignal.timeout(2000),
          }).then((r) => (r.ok ? r.json() : null));

          const queryPages = extRes?.query?.pages;
          const page = queryPages ? Object.values(queryPages)[0] as any : null;
          const extLinks: Array<{ '*': string }> = page?.extlinks || [];
          for (const l of extLinks) {
            const m = l['*'].match(/title\/(tt\d{7,8})/i);
            if (m) {
              imdbId = m[1];
              break;
            }
          }
        } catch {}
      }

      // If still missing IMDb ID or TMDB ID, check wikibase item
      if (!imdbId || !tmdbId) {
        try {
          const propUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(wikiTitle || '')}&format=json`;
          const propRes = await fetch(propUrl, {
            headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
            signal: AbortSignal.timeout(2000),
          }).then((r) => (r.ok ? r.json() : null));

          const qp = propRes?.query?.pages;
          const page = qp ? Object.values(qp)[0] as any : null;
          const wikibaseItem = page?.pageprops?.wikibase_item;
          if (wikibaseItem) {
            const [wdP345, wdTmdbTv, wdTmdbMovie] = await Promise.allSettled([
              !imdbId
                ? fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikibaseItem}&property=P345&format=json`, {
                    headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
                    signal: AbortSignal.timeout(2000),
                  }).then((r) => (r.ok ? r.json() : null))
                : Promise.resolve(null),
              !tmdbId
                ? fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikibaseItem}&property=P4983&format=json`, {
                    headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
                    signal: AbortSignal.timeout(2000),
                  }).then((r) => (r.ok ? r.json() : null))
                : Promise.resolve(null),
              !tmdbId
                ? fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikibaseItem}&property=P4947&format=json`, {
                    headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
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
        } catch {}
      }
    }
  } catch {}

  if (!imdbId && fallbackImdb) {
    imdbId = fallbackImdb.id;
    if (!movieTitle || movieTitle === coreTitle) movieTitle = fallbackImdb.l || movieTitle;
    if (!poster && fallbackImdb.i?.imageUrl) poster = fallbackImdb.i.imageUrl;
  }

  // If IMDb ID was populated by Wikipedia or fallback, do reverse lookup for TMDb ID if still missing
  if (imdbId && !tmdbId) {
    try {
      const wdSearch = await fetch(`https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=haswbstatement:P345=${imdbId}&format=json`, {
        headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
        signal: AbortSignal.timeout(2000),
      }).then((r) => (r.ok ? r.json() : null));

      const entityId = wdSearch?.query?.search?.[0]?.title;
      if (entityId) {
        const claimsRes = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&format=json`, {
          headers: { 'User-Agent': 'NexoraMedia/2.0 (developer@nexora.ai)' },
          signal: AbortSignal.timeout(2000),
        }).then((r) => (r.ok ? r.json() : null));

        const claims = claimsRes?.claims;
        if (mediaType === 'series' && claims?.P4983?.[0]?.mainsnak?.datavalue?.value) {
          tmdbId = String(claims.P4983[0].mainsnak.datavalue.value);
        } else if (claims?.P4947?.[0]?.mainsnak?.datavalue?.value) {
          tmdbId = String(claims.P4947[0].mainsnak.datavalue.value);
        }
      }
    } catch {}
  }

  // 2. Search DuckDuckGo as fallback for TMDb / IMDb if still unpopulated
  try {
    if (!imdbId || !tmdbId) {
      const tmdbParam = isExplicitSeries ? `${coreTitle} tv series themoviedb` : `${coreTitle} movie themoviedb`;
      const tmdbRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(tmdbParam)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(3000),
      }).then((r) => (r.ok ? r.text() : ''));

      if (tmdbRes) {
        const tmdbTv = tmdbRes.match(/themoviedb\.org(?:%2F|\/)tv(?:%2F|\/)(\d+)/i) || safeDecode(tmdbRes).match(/themoviedb\.org\/tv\/(\d+)/i);
        const tmdbMovie = tmdbRes.match(/themoviedb\.org(?:%2F|\/)movie(?:%2F|\/)(\d+)/i) || safeDecode(tmdbRes).match(/themoviedb\.org\/movie\/(\d+)/i);
        if (tmdbTv) {
          tmdbId = tmdbTv[1];
          mediaType = 'series';
        } else if (tmdbMovie) {
          tmdbId = tmdbMovie[1];
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
