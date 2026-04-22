import { proxyBackendRequest } from "@/lib/backendProxy";

export async function GET(request: Request) {
  return proxyBackendRequest(request, "/tenants/members");
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, "/tenants/members");
}
