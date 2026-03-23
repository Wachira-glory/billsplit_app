import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const UNDA_URL = process.env.NEXT_PUBLIC_UNDA_SUPABASE_URL!;
const UNDA_ANON_KEY = process.env.NEXT_PUBLIC_UNDA_SUPABASE_ANON_KEY!;

// Signs in to Unda with the platform credentials and returns an access token
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

  if (!response.ok) {
    throw new Error('Failed to authenticate with Unda');
  }

  const data = await response.json();
  return data.access_token;
}

export const undaFetch = async (
  path: string,
  // Change 'RequestInit' to 'any' or a custom type to allow object bodies
  options: any = {} 
): Promise<any> => {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch('/api/unda', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      path, 
      method, 
      body, // This is already being handled correctly by your Proxy
      headers 
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unda request failed');
  }

  return response.json();
};
// export const undaFetch = async (
//   path: string,
//   options: RequestInit = {}
// ): Promise<any> => {
//   const token = await getUndaToken();

//   const response = await fetch(`${UNDA_URL}/rest/v1/${path}`, {
//     ...options,
//     headers: {
//       'apikey': UNDA_ANON_KEY,
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//       'Prefer': 'return=representation',
//       ...options.headers,
//     },
//   });

//   if (!response.ok) {
//     const text = await response.text();
//     throw new Error(text || 'Unda request failed');
//   }

//   return response.json();
// };
// export const getUndaAuthClient = async () => {
//   const { data: { session } } = await supabase.auth.getSession();

//   return createBrowserClient(UNDA_URL, UNDA_ANON_KEY, {
//     global: {
//       headers: {
//         Authorization: `Bearer ${session?.access_token}`,
//       },
//     },
//   });
// };