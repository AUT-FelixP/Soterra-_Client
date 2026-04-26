import { currentSession, publicSession } from "@/lib/backendProxy";

export async function GET() {
  const session = await currentSession();
  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({ user: publicSession(session) });
}
