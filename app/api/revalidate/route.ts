import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { path = "/" } = await request.json().catch(() => ({ path: "/" }));
  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
