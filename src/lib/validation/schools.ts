export const SCHOOL_STATUSES = ["trial", "active", "suspended"] as const;
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];
