import { proxyBackendRequest } from "@/lib/backendProxy";

export async function GET(request: Request) {
  return proxyBackendRequest(request, "/dashboard/company");
}
