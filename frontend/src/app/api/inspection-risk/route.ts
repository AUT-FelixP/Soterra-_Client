import { proxyBackendRequest } from "@/lib/backendProxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackendRequest(request, `/inspection-risk${url.search}`);
}
