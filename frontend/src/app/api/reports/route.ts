import { proxyBackendRequest } from "@/lib/backendProxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackendRequest(request, `/reports${url.search}`);
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, "/reports");
}

export async function DELETE(request: Request) {
  return proxyBackendRequest(request, "/reports");
}
