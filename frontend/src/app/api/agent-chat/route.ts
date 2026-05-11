import { proxyBackendRequest } from "@/lib/backendProxy";

export async function GET(request: Request) {
  return proxyBackendRequest(request, "/agent/chat/status");
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, "/agent/chat");
}
