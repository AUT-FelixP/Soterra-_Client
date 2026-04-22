import { proxyBackendRequest } from "@/lib/backendProxy";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyBackendRequest(request, `/tenants/members/${encodeURIComponent(id)}`);
}
