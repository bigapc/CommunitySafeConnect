import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const otp = data?.properties?.email_otp;

  if (!otp) {
    return NextResponse.json({ error: "Failed to generate one-time code" }, { status: 500 });
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n[CommunitySafeConnect] One-time code for ${email}: ${otp}\n`);
  }

  return NextResponse.json({ success: true });
}
