import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, reasoning_mode, temperature } = body;

    // 1. Try forwarding to Python backend (port 8000) if active
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const backendRes = await fetch('http://127.0.0.1:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (backendRes.ok && backendRes.body) {
        return new Response(backendRes.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        });
      }
    } catch {
      // Backend not running on 8000, fall through to direct Next.js zero-key stream
    }

    // 2. Direct Zero-Key Stream from Next.js (Zero API keys required!)
    let formattedMessages = Array.isArray(messages) ? [...messages] : [];

    if (reasoning_mode) {
      formattedMessages = [
        {
          role: 'system',
          content:
            'You are NEXORA Reasoning Engine (comparable to DeepSeek-R1 & OpenAI o3).\n' +
            'First conduct a rigorous step-by-step thinking process enclosed in <thought> and </thought> tags.\n' +
            'After </thought>, provide the polished, authoritative, clean final response without mentioning the thought tags.',
        },
        ...formattedMessages.filter((m) => m.role !== 'system'),
      ];
    }

    const payload = {
      model: 'openai-fast',
      messages: formattedMessages,
      temperature: temperature || 0.7,
      stream: true,
    };

    const upstreamRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      // Fallback to GET endpoint
      const fullPrompt = formattedMessages.map((m) => `${m.role}: ${m.content}`).join('\n');
      const getRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt.slice(0, 8000))}?model=openai-fast`);
      const fullText = await getRes.text();

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: fullText })}\n\n`));
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

    // Stream SSE directly
    const reader = upstreamRes.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const transformStream = new ReadableStream({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }

          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(raw);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              } catch {
                // Ignore parse errors
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
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token: `I encountered a momentary connection glitch (${err.message}). Please try asking again!` })}\n\n`)
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }
}
