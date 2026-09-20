import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Universal Multi-language Neural TTS Engine
 * Provides crystal-clear native Telugu (te), Hindi (hi), and English (en)
 * audio directly in browser, even when Windows/macOS has no local voice pack installed.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '';
  const lang = searchParams.get('lang') || 'te';

  if (!text.trim()) {
    return new NextResponse('Missing text parameter', { status: 400 });
  }

  // Clean text of markdown and media tags
  const clean = text
    .replace(/:::[^}]+:::/g, '')
    .replace(/[*#`_~>\[\]()$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 450); // limit chunk for fast playback

  try {
    const encoded = encodeURIComponent(clean);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encoded}`;

    const upstream = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse('Failed to fetch TTS audio', { status: upstream.status });
    }

    const audioBuffer = await upstream.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'TTS Error', { status: 500 });
  }
}
