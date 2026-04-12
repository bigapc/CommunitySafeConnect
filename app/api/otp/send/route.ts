import { NextRequest, NextResponse } from "next/server";
import { generateOtp, saveOtp } from "@/lib/otpStore";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const code = generateOtp();
  saveOtp(email, code);

  // Print the one-time code to the terminal for development use
  console.log(`\n[OTP] One-time code for ${email}: ${code}\n`);

  return NextResponse.json({ success: true });
}
