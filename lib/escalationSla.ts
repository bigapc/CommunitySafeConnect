import type { EscalationRequestRow } from "@/lib/localDataStore";

export type EscalationSlaLevel =
  | "overdue"
  | "due_soon"
  | "awaiting_schedule"
  | "tracked"
  | "resolved";

export interface EscalationSlaState {
  level: EscalationSlaLevel;
  label: string;
}

export interface EscalationSlaSummary {
  overdue: number;
  dueSoon: number;
  awaitingSchedule: number;
}

const DUE_SOON_WINDOW_MS = 2 * 60 * 60 * 1000;
const SCHEDULE_GRACE_MS = 12 * 60 * 60 * 1000;

export function getEscalationSlaState(
  request: EscalationRequestRow,
  now = Date.now()
): EscalationSlaState {
  if (request.status === "resolved") {
    return {
      level: "resolved",
      label: "Resolved",
    };
  }

  if (!request.verification_call_at) {
    const createdAt = new Date(request.created_at).getTime();
    const overdueForScheduling = now - createdAt > SCHEDULE_GRACE_MS;

    return overdueForScheduling
      ? { level: "overdue", label: "Scheduling overdue" }
      : { level: "awaiting_schedule", label: "Awaiting schedule" };
  }

  const verificationAt = new Date(request.verification_call_at).getTime();

  if (verificationAt <= now) {
    return {
      level: "overdue",
      label: "Verification overdue",
    };
  }

  if (verificationAt - now <= DUE_SOON_WINDOW_MS) {
    return {
      level: "due_soon",
      label: "Verification due soon",
    };
  }

  return {
    level: "tracked",
    label: "On schedule",
  };
}

export function summarizeEscalationSla(
  requests: EscalationRequestRow[],
  now = Date.now()
): EscalationSlaSummary {
  return requests.reduce<EscalationSlaSummary>(
    (summary, request) => {
      const state = getEscalationSlaState(request, now);

      if (state.level === "overdue") {
        summary.overdue += 1;
      } else if (state.level === "due_soon") {
        summary.dueSoon += 1;
      } else if (state.level === "awaiting_schedule") {
        summary.awaitingSchedule += 1;
      }

      return summary;
    },
    {
      overdue: 0,
      dueSoon: 0,
      awaitingSchedule: 0,
    }
  );
}
