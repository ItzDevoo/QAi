import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTestRunWithIssues } from "@/lib/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getTestRunWithIssues(id);

  if (!result) {
    return NextResponse.json({ error: "Test run not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
