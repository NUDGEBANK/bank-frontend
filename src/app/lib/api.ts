let refreshPromise: Promise<boolean> | null = null;

type JsonRecord = Record<string, unknown>;

type ApiError = {
  message?: string;
};

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
    window.dispatchEvent(new Event("auth-change"));
    return true;
  }

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

  if (res.status === 401 && retry && !path.startsWith("/api/auth/")) {
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

  return data as T;
}

export async function postJson<T>(path: string, body: JsonRecord): Promise<T> {
  return requestJson<T>(path, body, true);
}

export async function getJson<T>(path: string): Promise<T> {
  return requestJsonWithMethod<T>("GET", path, undefined, true);
}
