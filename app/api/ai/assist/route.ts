import { NextRequest, NextResponse } from "next/server";
import { requireRoleForApi } from "@/lib/access";

type AssistantIntent = "triage" | "escalation" | "debrief" | "communications" | "general";

function detectIntent(prompt: string): AssistantIntent {
  const text = prompt.toLowerCase();

  if (text.includes("triage") || text.includes("priority") || text.includes("queue")) {
    return "triage";
  }

  if (text.includes("escalat") || text.includes("overdue") || text.includes("critical")) {
    return "escalation";
  }

  if (text.includes("debrief") || text.includes("summary") || text.includes("timeline")) {
    return "debrief";
  }

  if (text.includes("message") || text.includes("email") || text.includes("notify") || text.includes("stakeholder")) {
    return "communications";
  }

  return "general";
}

function buildGuidance(intent: AssistantIntent, prompt: string) {
  if (intent === "triage") {
    return [
      "Triage recommendation:",
      "1. Confirm severity, impacted area, and current status.",
      "2. Assign owner and due time in task channels immediately.",
      "3. Prioritize any SLA-risk or overdue tasks ahead of normal queue work.",
      "4. Link task channels to incidents for bidirectional visibility.",
      "5. Post a 15-minute update cadence in command channels until stabilized.",
      "",
      `Prompt interpreted: ${prompt}`,
    ].join("\n");
  }

  if (intent === "escalation") {
    return [
      "Escalation guidance:",
      "1. Promote unresolved high-risk items to incident command.",
      "2. Notify emergency channel with current owner and ETA.",
      "3. Verify evidence trail and policy-compliant access scope.",
      "4. Set explicit resolution criteria and handoff checkpoints.",
      "5. Log every state transition for after-action auditability.",
      "",
      `Prompt interpreted: ${prompt}`,
    ].join("\n");
  }

  if (intent === "debrief") {
    return [
      "Debrief structure:",
      "1. Incident timeline (detect, triage, escalation, resolution).",
      "2. What worked well and where response lag occurred.",
      "3. SLA breaches and automated routing outcomes.",
      "4. Follow-up actions, owners, and due dates.",
      "5. Communication lessons for next event cycle.",
      "",
      `Prompt interpreted: ${prompt}`,
    ].join("\n");
  }

  if (intent === "communications") {
    return [
      "Stakeholder communication draft template:",
      "- Situation: concise current state and impact.",
      "- Actions: what responders are doing now.",
      "- Timing: next update window and accountable owner.",
      "- Ask: required actions from recipients.",
      "- Assurance: safety controls and evidence integrity maintained.",
      "",
      `Prompt interpreted: ${prompt}`,
    ].join("\n");
  }

  return [
    "AI Assistant can help with:",
    "- incident triage plans",
    "- escalation strategy",
    "- stakeholder communications",
    "- debrief summaries",
    "- operational checklists",
    "",
    `Prompt interpreted: ${prompt}`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const access = await requireRoleForApi("moderator");

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const intent = detectIntent(prompt);
    const answer = buildGuidance(intent, prompt);

    return NextResponse.json({ answer, intent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process AI request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
