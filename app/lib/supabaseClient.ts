import { createBrowserClient } from '@supabase/ssr';

// 1. Initialize your own Supabase Client
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Global Fetcher for Unda
 * This sends requests to your internal /api/unda route, 
 * which acts as a bridge to the Unda servers.
 */
export const undaFetch = async (
  path: string,
  options: any = {} 
): Promise<any> => {
  const { method = 'GET', body, headers = {} } = options;

  // Get the current user's session from YOUR Supabase
  // This token proves to Unda that the request is coming from a real user
  const { data: { session } } = await supabase.auth.getSession();

  try {
    const response = await fetch('/api/unda', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        path, 
        method, 
        body, 
        headers: {
          ...headers,
          // Attach the JWT token so the proxy/Unda can verify the user
          'Authorization': `Bearer ${session?.access_token}`,
          'x-platform-uid': process.env.NEXT_PUBLIC_UNDA_PLATFORM_UID
        } 
      }),
    });

    if (!response.ok) {
      // Try to parse the error message from the proxy
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Unda request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    console.error("undaFetch Error:", err.message);
    throw err;
  }
};