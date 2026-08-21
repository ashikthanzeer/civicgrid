const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const isMockMode = USE_MOCK;
