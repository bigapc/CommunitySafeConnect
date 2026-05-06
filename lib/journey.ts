export type JourneyMode = "standard" | "silent";

export interface JourneyContext {
  journeyId: string;
  mode: JourneyMode;
}

interface JourneySearchParams {
  [key: string]: string | string[] | undefined;
}

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function createJourneyContext(mode: JourneyMode = "standard"): JourneyContext {
  const journeyId = `J-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return { journeyId, mode };
}

export function getJourneyContext(searchParams?: JourneySearchParams): JourneyContext {
  const journeyParam = pickFirst(searchParams?.journey);
  const modeParam = pickFirst(searchParams?.mode);

  const journeyId = journeyParam && journeyParam.trim().length > 0
    ? journeyParam.trim()
    : createJourneyContext("standard").journeyId;

  const mode: JourneyMode = modeParam === "silent" ? "silent" : "standard";

  return {
    journeyId,
    mode,
  };
}

export function buildJourneyQuery(context: JourneyContext): string {
  const params = new URLSearchParams({
    journey: context.journeyId,
    mode: context.mode,
  });

  return `?${params.toString()}`;
}
