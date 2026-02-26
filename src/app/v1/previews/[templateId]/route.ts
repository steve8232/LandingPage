import type { NextRequest } from "next/server";
import { composeV1Template } from "../../../../../v1/composer/composeV1Template";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  // In Next.js 15+/16, params is a Promise — await it.
  const resolvedParams = await params;
  const templateId = resolvedParams.templateId;

  try {
    const { html } = composeV1Template(templateId);
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : `Failed to compose v1 template: ${templateId}`;

    return new Response(message, {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
