export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'Server misconfigured — env var missing' }), { status: 500 });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { prompt } = body;
  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing prompt field' }), { status: 400 });
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await groqRes.json();

  if (data.error) {
    return new Response(JSON.stringify({ error: data.error.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }

  const text = data.choices?.[0]?.message?.content || '';
  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}
