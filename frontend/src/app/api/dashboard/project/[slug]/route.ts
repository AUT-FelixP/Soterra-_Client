import { proxyBackendRequest } from "@/lib/backendProxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return proxyBackendRequest(request, `/dashboard/project/${slug}`);
}
