import { proxyBackendRequest } from "@/lib/backendProxy";

export function POST(request: Request) {
  return proxyBackendRequest(request, "/analytics/issues/query");
}
