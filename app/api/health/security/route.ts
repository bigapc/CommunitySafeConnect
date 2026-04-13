import { NextResponse } from "next/server";
import { getSecurityHealthSnapshot } from "@/lib/securityHealth";

export async function GET() {
  return NextResponse.json(await getSecurityHealthSnapshot());
}
