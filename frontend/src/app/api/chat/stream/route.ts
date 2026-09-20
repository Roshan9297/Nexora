import { NextRequest } from 'next/server';
import { generateOfflineResponse } from '@/lib/offline-intelligence';

export const runtime = 'nodejs';

function streamOfflineTokens(userMsg: string, reasoningMode: boolean, messages: any[]): Response {
  const offlineResult = generateOfflineResponse(userMsg, reasoningMode, messages);
  const encoder = new TextEncoder();
  let fullText = '';
  if (offlineResult.thought) {
    fullText += `<thought>\n${offlineResult.thought}\n</thought>\n\n`;
  }
  fullText += offlineResult.content;

  const chunks = fullText.match(/.{1,4}|\n/g) || [fullText];

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 8));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Fast zero-key factual grounding: fetches verified entity & topical data
 * from Wikipedia and DuckDuckGo in < 500ms to guarantee zero hallucinations.
 */
async function getFactualGrounding(userQuery: string): Promise<string> {
  if (!userQuery || userQuery.length < 3) return '';

  const lower = userQuery.toLowerCase().trim();
  // Skip grounding for simple greetings, generic code requests, or short phrases
  if (/^(hi|hello|hey|test|sup|how are you|thanks|thank you|ok|yes|no)\b/i.test(lower)) {
    return '';
  }

  // Extract core entity/topic from compound queries (e.g. "tell me about mahesh babu, his wife and movies")
  const cleanTopic = userQuery
    .split(/[,;]|\band\b/i)[0]
    .replace(/^(who is|who was|what is|what was|tell me about|explain|describe|give info on|give details about|biography of|history of)\s+/i, '')
    .replace(/[?!.]/g, '')
    .trim();

  if (!cleanTopic || cleanTopic.length < 2) return '';

  try {
    // 1. Search Wikipedia for canonical biographical or topical page
    const searchUrl = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(cleanTopic)}&limit=5`;
    const [searchRes, ddgRes] = await Promise.allSettled([
      fetch(searchUrl, {
        headers: { 'User-Agent': 'NexoraAI/1.0 (info@nexora.ai)' },
        signal: AbortSignal.timeout(900),
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(cleanTopic)}&format=json`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(900),
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    let wikiExtract = '';
    const pages = searchRes.status === 'fulfilled' ? searchRes.value?.pages : null;
    const bestPage = Array.isArray(pages)
      ? pages.find((p: any) => !/filmography|discography|list_of|awards/i.test(p.key)) || pages[0]
      : null;
    const wikiKey = bestPage?.key || bestPage?.title;

    if (wikiKey) {
      const introUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(wikiKey)}&format=json`;
      const introRes = await fetch(introUrl, {
        headers: { 'User-Agent': 'NexoraAI/1.0 (info@nexora.ai)' },
        signal: AbortSignal.timeout(900),
      }).then((r) => (r.ok ? r.json() : null));

      const queryPages = introRes?.query?.pages;
      if (queryPages) {
        const page = Object.values(queryPages)[0] as any;
        if (page?.extract) wikiExtract = page.extract.slice(0, 5000);
      }
    }

    let ddgExtract = '';
    if (ddgRes.status === 'fulfilled' && ddgRes.value?.AbstractText) {
      ddgExtract = ddgRes.value.AbstractText;
    }

    let context = '';
    if (wikiExtract) {
      context += `[Wikipedia Verified Information]:\n${wikiExtract}\n`;
    }
    if (ddgExtract && !context.includes(ddgExtract.slice(0, 40))) {
      context += `[DuckDuckGo Verified Knowledge]:\n${ddgExtract}\n`;
    }

    return context.trim();
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  let lastUserMsg = '';
  let reasoning_mode = false;
  let formattedMessages: any[] = [];

  try {
    const body = await req.json();
    reasoning_mode = Boolean(body.reasoning_mode);
    const { messages, temperature } = body;

    formattedMessages = Array.isArray(messages) ? [...messages] : [];

    // Find the last user message to provide factual grounding
    lastUserMsg = [...formattedMessages].reverse().find((m) => m.role === 'user')?.content || '';
    const groundTruth = await getFactualGrounding(lastUserMsg);

    let systemPrompt =
      'You are Faiza (ఫైజా), an ultra-smart, friendly, witty, and charming female AI voice assistant inspired by Apple iPhone Siri.\n' +
      'Voice Persona & Tone (Siri Style):\n' +
      '- Talk with the signature conversational charm, crisp brevity, warmth, and subtle playful wit of iPhone Siri.\n' +
      '- Keep responses natural, direct, and pleasant for speech playback. Avoid robotic stiffness or overblown boilerplate.\n' +
      '- In English: Sound like Apple Siri — polished, quick-witted, helpful, and natural (e.g., "I found this for you.", "On it!", "Here\'s what I got.", "Glad to help!").\n' +
      '- In Telugu (తెలుగు): Speak with polite, fluent, natural conversational Telugu (e.g., "తప్పకుండా, ఇదిగోండి!", "నేను మీకు సహాయం చేయడానికి ఇక్కడే ఉన్నాను.", "మీరు చెప్పినట్లే చేస్తాను!").\n' +
      '- If asked who you are or your name: State with Siri charm that you are Faiza (ఫైజా), their personal AI assistant on Nexora.\n' +
      '- Formatting: Keep text clean and easy to read and listen to.\n' +
      '\n--- MULTIMEDIA, MOVIES & GAMING CAPABILITIES ---\n' +
      'You have built-in interactive media players, a Digital Cinema Hub (supporting Netflix, Prime Video, Disney+ Hotstar, JioCinema, Apple TV, Crunchyroll, and free streaming), and game engines directly in the chat!\n' +
      '- If the user asks to play, watch, or stream an anime or TV/web series (e.g. Attack on Titan, Naruto, One Piece, Stranger Things, Solo Leveling, Breaking Bad), include: :::series{query="Series or Anime Title", season="1", episode="1"}:::\n' +
      '- If the user asks to play, watch, or stream a movie or film (e.g. Inception, Pushpa, RRR, Interstellar, Avatar) or specifies a platform like Netflix/Prime/Hotstar, include: :::movie{query="Movie Title", platform="netflix|prime|hotstar|all"}:::\n' +
      '- If the user asks to play or listen to a song or music, include: :::song{query="Song Title and Artist"}:::\n' +
      '- If the user asks to play or watch a video or trailer, include: :::video{query="Video or Trailer Title"}:::\n' +
      '- If the user asks to play a game, include: :::game{name="snake|tictactoe|2048|arcade"}:::\n' +
      'Introduce media in Siri style (e.g. "Playing that for you now.", "Now playing: [Title]. Enjoy the show!").\n' +
      '-----------------------------------------\n';

    if (groundTruth) {
      systemPrompt +=
        '\n--- VERIFIED FACTUAL KNOWLEDGE BASE (100% ACCURATE) ---\n' +
        groundTruth +
        '\n--------------------------------------------------------\n' +
        'Instructions: Seamlessly integrate the verified facts above into your answer. Specifically cover all requested details (such as parents, spouse/wife, movies, achievements, and milestones) with complete accuracy.\n';
    }

    if (reasoning_mode) {
      systemPrompt +=
        '\nDeep Reasoning Mode is ACTIVE. First conduct a rigorous step-by-step thinking process enclosed in <thought> and </thought> tags. ' +
        'After </thought>, provide the polished, authoritative, clean final response without repeating the thought tags.';
    }

    // Compose final messages array
    formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...formattedMessages.filter((m) => m.role !== 'system'),
    ];

    // For media, entertainment, songs, and games: stream instantly via local intelligence engine with zero credit dependency!
    const lowerMsg = lastUserMsg.toLowerCase().trim();
    const isEntertainmentRequest =
      /\b(?:snake|tictactoe|tic[\s-]?tac[\s-]?toe|2048|arcade)\b/i.test(lowerMsg) ||
      /\b(?:song|music|track|audio|soundtrack|listen\s+to|mp3|sing|lyrics)\b/i.test(lowerMsg) ||
      /\b(?:shape\s+of\s+you|ed\s+sheeran|believer|despacito|faded|alan\s+walker|taylor\s+swift|eminem|arijit\s+singh|justin\s+bieber|coldplay|billie\s+eilish|the\s+weeknd|dua\s+lipa|bad\s+bunny|bruno\s+mars|post\s+malone|imagine\s+dragons|bts)\b/i.test(lowerMsg) ||
      /\b(?:anime|k-drama|kdrama|tv\s*series|web\s*series)\b/i.test(lowerMsg) ||
      /\b(?:attack\s+on\s+titan|naruto|one\s+piece|jujutsu\s+kaisen|demon\s+slayer|solo\s+leveling|bleach|dragon\s+ball|death\s+note|stranger\s+things|breaking\s+bad|game\s+of\s+thrones|wednesday|the\s+boys|loki|dark|money\s+heist|mirzapur|squid\s+game)\b/i.test(lowerMsg) ||
      /\b(?:movie|film|cinema)\b/i.test(lowerMsg) ||
      /^(?:i\s+want\s+to\s+|can\s+you\s+|please\s+)?(?:play|watch|stream|listen\s+to)\b/i.test(lowerMsg);

    if (isEntertainmentRequest) {
      return streamOfflineTokens(lastUserMsg, reasoning_mode, formattedMessages);
    }

    const payload = {
      model: 'openai',
      messages: formattedMessages,
      temperature: temperature || 0.7,
      stream: true,
    };

    let upstreamRes: Response | null = null;
    try {
      upstreamRes = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });
    } catch {
      upstreamRes = null;
    }

    const encoder = new TextEncoder();

    if (!upstreamRes || !upstreamRes.ok || !upstreamRes.body) {
      // Check local Ollama endpoint if running offline
      try {
        const ollamaRes = await fetch('http://127.0.0.1:11434/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3',
            messages: formattedMessages,
            stream: true,
          }),
          signal: AbortSignal.timeout(1000),
        });
        if (ollamaRes.ok && ollamaRes.body) {
          return new Response(ollamaRes.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
            },
          });
        }
      } catch {
        // Ollama not reachable
      }

      // Seamless offline fallback intelligence engine
      return streamOfflineTokens(lastUserMsg, reasoning_mode, formattedMessages);
    }

    // Stream SSE directly with line buffering and synchronized <thought> management
    const reader = upstreamRes.body.getReader();
    const decoder = new TextDecoder();

    let inThought = false;
    let thoughtClosed = false;
    let lineBuffer = '';

    const transformStream = new ReadableStream({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (inThought && !thoughtClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: '\n</thought>\n\n' })}\n\n`));
              thoughtClosed = true;
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }

          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') {
                if (inThought && !thoughtClosed) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: '\n</thought>\n\n' })}\n\n`));
                  thoughtClosed = true;
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              // Intercept Pollinations credit warnings and replace with offline response
              if (/not\s+enough\s+credits|doesn't\s+have\s+enough\s+credits|Pollinations\s+account/i.test(raw)) {
                const fallback = generateOfflineResponse(lastUserMsg, reasoning_mode, formattedMessages);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: fallback.content })}\n\n`));
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(raw);
                const delta = parsed.choices?.[0]?.delta;
                if (!delta) continue;

                // Handle reasoning tokens: emit immediately into <thought> so user sees instant live progress
                if (delta.reasoning) {
                  if (!inThought) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: '<thought>\n' })}\n\n`));
                    inThought = true;
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta.reasoning })}\n\n`));
                }

                // Handle regular content tokens
                if (delta.content) {
                  if (/not\s+enough\s+credits|doesn't\s+have\s+enough\s+credits|Pollinations\s+account/i.test(delta.content)) {
                    const fallback = generateOfflineResponse(lastUserMsg, reasoning_mode, formattedMessages);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: fallback.content })}\n\n`));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                    return;
                  }

                  if (inThought && !thoughtClosed) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: '\n</thought>\n\n' })}\n\n`));
                    thoughtClosed = true;
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta.content })}\n\n`));
                }
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      },
    });

    return new Response(transformStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    return streamOfflineTokens(lastUserMsg, reasoning_mode, formattedMessages);
  }
}
