export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["published"],
  published: ["paused", "closed_hired", "closed_no_hire"],
  paused: ["published", "closed_hired", "closed_no_hire"],
  closed_no_hire: ["published"],
  closed_hired: [],
};

export function canTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isClosedPermanently(status: string): boolean {
  return status === "closed_hired";
}

export function canReopen(status: string): boolean {
  return status === "closed_no_hire";
}
