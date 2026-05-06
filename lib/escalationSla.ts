import type { EscalationRequestRow } from "@/lib/localDataStore";

export type EscalationSlaLevel =
  | "overdue"
  | "due_soon"
  | "awaiting_schedule"
  | "tracked"
  | "resolved";

export type EscalationPriorityLevel = "critical" | "high" | "standard";

export interface EscalationSlaState {
  level: EscalationSlaLevel;
  label: string;
}

export interface EscalationPriorityState {
  level: EscalationPriorityLevel;
  label: string;
}

export interface EscalationSlaSummary {
  overdue: number;
  dueSoon: number;
  awaitingSchedule: number;
}

export interface EscalationPrioritySummary {
  critical: number;
  high: number;
  standard: number;
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

export function getEscalationPriorityState(request: EscalationRequestRow): EscalationPriorityState {
  if (request.category === "legal_coordination" || request.category === "sensitive_compliance") {
    return {
      level: "critical",
      label: "Critical priority",
    };
  }

  if (request.category === "exceptional_data_review" || request.category === "redaction_review") {
    return {
      level: "high",
      label: "High priority",
    };
  }

  return {
    level: "standard",
    label: "Standard priority",
  };
}

function getPriorityWeight(level: EscalationPriorityLevel) {
  if (level === "critical") {
    return 300;
  }

  if (level === "high") {
    return 200;
  }

  return 100;
}

function getSlaWeight(level: EscalationSlaLevel) {
  if (level === "overdue") {
    return 40;
  }

  if (level === "due_soon") {
    return 30;
  }

  if (level === "awaiting_schedule") {
    return 20;
  }

  if (level === "tracked") {
    return 10;
  }

  return 0;
}

export function sortEscalationsByUrgency(
  requests: EscalationRequestRow[],
  now = Date.now()
) {
  return [...requests].sort((left, right) => {
    const leftScore = getPriorityWeight(getEscalationPriorityState(left).level) + getSlaWeight(getEscalationSlaState(left, now).level);
    const rightScore = getPriorityWeight(getEscalationPriorityState(right).level) + getSlaWeight(getEscalationSlaState(right, now).level);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
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

export function summarizeEscalationPriority(
  requests: EscalationRequestRow[]
): EscalationPrioritySummary {
  return requests.reduce<EscalationPrioritySummary>(
    (summary, request) => {
      const priority = getEscalationPriorityState(request);
      summary[priority.level] += 1;
      return summary;
    },
    {
      critical: 0,
      high: 0,
      standard: 0,
    }
  );
}
