import { proxyBackendRequest } from "@/lib/backendProxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyBackendRequest(request, `/tracker/${encodeURIComponent(id)}`);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyBackendRequest(request, `/tracker/${encodeURIComponent(id)}`);
}
