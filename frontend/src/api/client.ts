const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '';
// Ensure no trailing slash so ${API_BASE}${endpoint} is always well-formed
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const body = await response.json();
        if (body?.detail) errorDetail = body.detail;
      } catch {
        // use statusText fallback
      }
      throw new Error(`API Error (${response.status}): ${errorDetail}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${url || 'API'}. If using a free host (like Render), it may be waking up from sleep. Please wait ~30 seconds and refresh.`
      );
    }
    throw error;
  }
}

export const isMockMode = USE_MOCK;
