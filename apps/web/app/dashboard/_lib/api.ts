const RAW_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.GATEWAY_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
const BASE = (RAW_BASE || '').replace(/\/$/, '');

export function apiUrl(path: string) {
  return BASE ? `${BASE}${path}` : path;
}

async function tryFetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchJson<T>(path: string, init?: RequestInit) {
  const primary = apiUrl(path);
  try {
    return await tryFetchJson<T>(primary, init);
  } catch (error) {
    if (primary !== path) {
      return await tryFetchJson<T>(path, init);
    }
    throw error;
  }
}

const getRoleHeader = () => {
  if (typeof window === 'undefined') {
    // CHANGE: avoid cookies in server components to keep static rendering
    return 'Viewer';
  }
  const match = document.cookie.match(/sca_role=([^;]+)/i);
  return match?.[1] || 'Viewer';
};

export async function getJson<T>(path: string, init?: RequestInit) {
  return fetchJson<T>(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-demo-role': getRoleHeader(),
      ...(init?.headers || {}),
    },
  });
}
