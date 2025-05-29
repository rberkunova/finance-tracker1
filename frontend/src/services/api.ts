/* ---------- базовий URL ----------
 * 1) production / staging → задайте   VITE_API_URL   під час білду
 * 2) локальний dev (npm run dev)      → спрацює проксі на /api
 */
const meta = import.meta as any;              // ← прибирає TS-помилку
const API_BASE_URL: string =
  meta.env?.VITE_API_URL?.toString().replace(/\/+$/, '') || '/api';

/* ---------- базовий fetch ---------- */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const currentHeaders: Record<string, string> = {
    ...(!(options.body instanceof FormData) && {
      'Content-Type': 'application/json',
    }),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: currentHeaders,
  });

  if (!res.ok) {
    let payload: any;
    try {
      payload = await res.json();
    } catch {
      payload = { message: res.statusText };
    }
    const err: any = new Error(
      payload?.message || `Request failed with status ${res.status}`,
    );
    err.status = res.status;
    err.errorData = payload;
    throw err;
  }

  if (res.status === 204 || res.headers.get('content-length') === '0')
    return null;

  try {
    return await res.json();
  } catch (e) {
    console.error(
      'API response OK, but JSON parse failed:',
      e,
      'Raw text:',
      await res.text(),
    );
    throw new Error('Failed to parse server response as JSON.');
  }
};

/* ---------- helper із Bearer-токеном ---------- */
export const authRequest = async (
  endpoint: string,
  token: string,
  options: RequestInit = {},
) => {
  const initHeaders = options.headers
    ? (options.headers as Record<string, string>)
    : {};

  return apiRequest(endpoint, {
    ...options,
    headers: { ...initHeaders, Authorization: `Bearer ${token}` },
  });
};
