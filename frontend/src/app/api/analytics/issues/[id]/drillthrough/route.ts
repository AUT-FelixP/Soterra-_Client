import { proxyBackendRequest } from "@/lib/backendProxy";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyBackendRequest(request, `/analytics/issues/${encodeURIComponent(id)}/drillthrough`);
}
