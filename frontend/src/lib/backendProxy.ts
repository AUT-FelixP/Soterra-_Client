import { headers } from "next/headers";

function backendBaseUrl() {
  return process.env.BACKEND_BASE_URL ?? "http://127.0.0.1:8001";
}

export async function proxyBackendRequest(
  request: Request,
  backendPath: string
) {
  const target = new URL(backendPath, backendBaseUrl());
  const outgoingHeaders = new Headers();

  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");

  if (accept) {
    outgoingHeaders.set("accept", accept);
  }
  if (contentType) {
    outgoingHeaders.set("content-type", contentType);
  }

  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: outgoingHeaders,
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(target, init);
  const buffer = await response.arrayBuffer();
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");

  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  return new Response(buffer, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function fetchBackendJson<T>(backendPath: string): Promise<T> {
  const target = new URL(backendPath, backendBaseUrl());
  const response = await fetch(target, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function currentOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return host ? `${protocol}://${host}` : null;
}

