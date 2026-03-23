import { NextRequest, NextResponse } from 'next/server';

const UNDA_URL = process.env.NEXT_PUBLIC_UNDA_SUPABASE_URL!;
const UNDA_ANON_KEY = process.env.NEXT_PUBLIC_UNDA_SUPABASE_ANON_KEY!;

async function getUndaToken(): Promise<string> {
  const response = await fetch(`${UNDA_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': UNDA_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: process.env.NEXT_PUBLIC_UNDA_API_EMAIL,
      password: process.env.UNDA_API_PASSWORD,
    }),
  });

  if (!response.ok) throw new Error('Failed to authenticate with Unda');
  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  console.log('POST /api/unda called at', new Date().toISOString());
  try {
    const payload = await request.json();
    const { path, method = 'GET', body, headers = {} } = payload;
    const token = await getUndaToken();

    // Edge functions use a different base URL pattern
    const isEdgeFunction = path.startsWith('functions/');
    const url = isEdgeFunction
      ? `${UNDA_URL}/${path}`
      : `${UNDA_URL}/rest/v1/${path}`;

    console.log('Calling Unda:', method, url);

    const response = await fetch(url, {
      method,
      headers: {
        'apikey': UNDA_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    console.log('Unda status:', response.status);
    console.log('Unda response:', text);

    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, { status: response.status });

  } catch (err: any) {
    console.error('API route error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}