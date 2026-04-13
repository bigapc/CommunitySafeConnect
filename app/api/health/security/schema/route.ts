import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import {
  SECURITY_HEALTH_SCHEMA_PATH,
  SECURITY_HEALTH_SCHEMA_VERSION,
} from "@/lib/securityHealth";

export async function GET() {
  const schemaPath = join(process.cwd(), "docs", "security-health.schema.json");

  try {
    const schemaRaw = await readFile(schemaPath, "utf8");
    const schema = JSON.parse(schemaRaw) as unknown;

    return NextResponse.json(schema, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "X-Security-Health-Schema-Version": SECURITY_HEALTH_SCHEMA_VERSION,
        Link: `<${SECURITY_HEALTH_SCHEMA_PATH}>; rel="self"; type="application/schema+json"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Security health schema is unavailable." },
      { status: 500 }
    );
  }
}
