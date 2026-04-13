import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "SAML scaffold is not configured yet.",
      nextStep:
        "Configure enterprise SAML metadata exchange and assertion validation. Use OIDC start endpoint for current SSO testing.",
    },
    { status: 501 }
  );
}
