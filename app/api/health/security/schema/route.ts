import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const schemaPath = join(process.cwd(), "docs", "security-health.schema.json");

  try {
    const schemaRaw = await readFile(schemaPath, "utf8");
    const schema = JSON.parse(schemaRaw) as unknown;

    return NextResponse.json(schema, {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Security health schema is unavailable." },
      { status: 500 }
    );
  }
}
