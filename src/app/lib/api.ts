let refreshPromise: Promise<boolean> | null = null;
let refreshFailed = false;
const AUTH_REFRESH_BYPASS_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/refresh",
]);

type JsonRecord = Record<string, unknown>;

type ApiError = {
  message?: string;
};

function shouldRetryWithRefresh(path: string, status: number, retry: boolean): boolean {
  if (!retry || refreshFailed || (status !== 401 && status !== 403)) {
    return false;
  }

  return !AUTH_REFRESH_BYPASS_PATHS.has(path);
}

async function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  const ok = await refreshPromise;
  if (ok) {
    refreshFailed = false;
    window.dispatchEvent(new Event("auth-change"));
    return true;
  }

  refreshFailed = true;
  window.dispatchEvent(new Event("auth-change"));
  return false;
}

async function requestJson<T>(path: string, body?: JsonRecord, retry = true): Promise<T> {
  return requestJsonWithMethod<T>("POST", path, body, retry);
}

async function requestJsonWithMethod<T>(
  method: "GET" | "POST",
  path: string,
  body?: JsonRecord,
  retry = true,
): Promise<T> {
  const res = await fetch(`${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: method === "POST" && body ? JSON.stringify(body) : undefined,
  });

  if (shouldRetryWithRefresh(path, res.status, retry)) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return requestJsonWithMethod<T>(method, path, body, false);
    }
  }

  const data = (await res.json().catch(() => null)) as T | null;
  if (!res.ok) {
    const message = typeof (data as ApiError | null)?.message === "string"
      ? (data as ApiError).message
      : "REQUEST_FAILED";
    throw new Error(message);
  }

  if (path === "/api/auth/login" || path === "/api/auth/signup") {
    refreshFailed = false;
  }

  return data as T;
}

export async function postJson<T>(path: string, body: JsonRecord): Promise<T> {
  return requestJson<T>(path, body, true);
}

export async function getJson<T>(path: string): Promise<T> {
  return requestJsonWithMethod<T>("GET", path, undefined, true);
}
