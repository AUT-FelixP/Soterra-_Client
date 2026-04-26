import { cookies, headers } from "next/headers";
import { SESSION_COOKIE, type AppSession } from "@/lib/auth";

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

  const session = await currentSession();
  if (session) {
    outgoingHeaders.set("Authorization", `Bearer ${session.accessToken}`);
    outgoingHeaders.set("X-Soterra-Tenant-Id", session.tenantId);
    outgoingHeaders.set("X-Soterra-User-Id", session.userId);
    outgoingHeaders.set("X-Soterra-User-Role", session.role);
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
  const session = await currentSession();
  const requestHeaders = new Headers({ accept: "application/json" });
  if (session) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
    requestHeaders.set("X-Soterra-Tenant-Id", session.tenantId);
    requestHeaders.set("X-Soterra-User-Id", session.userId);
    requestHeaders.set("X-Soterra-User-Role", session.role);
  }
  const response = await fetch(target, {
    cache: "no-store",
    headers: requestHeaders,
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function encodeSession(session: AppSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

export function decodeSession(value: string | undefined): AppSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AppSession;
    if (!parsed.userId || !parsed.tenantId || !parsed.role || !parsed.accessToken) return null;
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function publicSession(session: AppSession) {
  return {
    userId: session.userId,
    tenantId: session.tenantId,
    tenantName: session.tenantName,
    name: session.name,
    email: session.email,
    role: session.role,
    expiresAt: session.expiresAt,
  };
}

export async function currentSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function currentOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return host ? `${protocol}://${host}` : null;
}
