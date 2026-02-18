import { QueryClient, QueryFunction } from "@tanstack/react-query";

/** Parse server error body; prefer JSON { error } for user-facing message. */
async function throwIfResNotOk(res: Response): Promise<never> {
  const text = await res.text();
  let message = res.statusText;
  try {
    const json = text ? JSON.parse(text) : null;
    if (json && typeof json.error === "string") message = json.error;
    else if (text && text.length < 200) message = text;
  } catch {
    if (text && text.length < 200) message = text;
  }
  const err = new Error(`${res.status}: ${message}`) as Error & { status: number };
  err.status = res.status;
  throw err;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

function handleGlobal401(error: Error) {
  if (/^401:/.test(error.message)) {
    window.location.href = "/api/login";
  }
}

/** User-facing message from API errors (strips status prefix when present). */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const m = error.message;
    const match = m.match(/^\d{3}:\s*(.+)$/);
    return match ? match[1].trim() : m;
  }
  return String(error);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
      onError: handleGlobal401,
    },
  },
});
