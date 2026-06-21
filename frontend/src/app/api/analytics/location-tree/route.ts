import { proxyBackendRequest } from "@/lib/backendProxy";

export function GET(request: Request) {
  return proxyBackendRequest(request, "/analytics/location-tree");
}
