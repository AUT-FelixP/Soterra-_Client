import { proxyBackendRequest } from "@/lib/backendProxy";

type ChangeIssueStatusPayload = {
  issueId?: unknown;
  status?: unknown;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as ChangeIssueStatusPayload | null;
  const issueId = typeof payload?.issueId === "string" ? payload.issueId.trim() : "";
  const status = typeof payload?.status === "string" ? payload.status.trim() : "";

  if (!issueId || !status) {
    return Response.json({ message: "Issue ID and status are required." }, { status: 400 });
  }

  const backendRequest = new Request(request.url, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  const backendResponse = await proxyBackendRequest(backendRequest, `/issues/${encodeURIComponent(issueId)}`);
  const backendPayload = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return Response.json(
      backendPayload ?? { message: "Issue status could not be updated." },
      { status: backendResponse.status }
    );
  }

  return Response.json({
    ...(backendPayload && typeof backendPayload === "object" ? backendPayload : {}),
    message: `${issueId} is now ${status}.`,
  });
}
