import { NextRequest, NextResponse } from "next/server";
import { generateOtp, saveOtp, checkRateLimit } from "@/lib/otpStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  if (!checkRateLimit(email)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting another code." },
      { status: 429 },
    );
  }

  const code = generateOtp();
  saveOtp(email, code);

  // Print the one-time code to the terminal for development use
  console.log(`\n[OTP] One-time code for ${email}: ${code}\n`);

  return NextResponse.json({ success: true });
}
