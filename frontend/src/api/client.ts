const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '';
// Ensure no trailing slash so ${API_BASE}${endpoint} is always well-formed
export const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3,
  delayMs = 2000,
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('civicgrid_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const body = await response.json();
          if (body?.detail) errorDetail = body.detail;
        } catch {
          // use statusText fallback
        }

        // Retry on 502/503/504 gateway timeouts caused by Render cold start
        if ([502, 503, 504].includes(response.status) && attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
          continue;
        }

        throw new Error(`API Error (${response.status}): ${errorDetail}`);
      }

      return await response.json();
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && (error.message.includes('fetch') || error.message.includes('NetworkError')));

      if (isNetworkError && attempt < retries) {
        // Wait before retrying (Render cold start wakeup delay)
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }

      if (isNetworkError) {
        throw new Error(
          `Failed to connect to backend server at ${url || 'API'}. Render free host may be waking up from sleep (~30 seconds). Please click Try Again.`
        );
      }
      throw error;
    }
  }

  throw new Error(`Failed to fetch from ${url} after ${retries} retries.`);
}

export const isMockMode = USE_MOCK;
