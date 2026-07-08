export type ReportStatus = "draft" | "under_review" | "certified" | "suspended";

export const reportStatuses: ReportStatus[] = ["draft", "under_review", "certified", "suspended"];

export const reportStatusLabels: Record<ReportStatus, string> = {
  draft: "Brouillon",
  under_review: "En vérification",
  certified: "Certifié",
  suspended: "Suspendu",
};

export const reservationStatuses = {
  occupancy: ["confirmed", "checked_in", "checked_out"],
  blocking: ["option", "confirmed", "checked_in"],
  excludedRevenue: ["cancelled", "expired", "no_show"],
} as const;

export const paymentStatuses = {
  collected: ["paid"],
  pending: ["pending"],
  excludedCash: ["cancelled", "failed"],
  refunds: ["refunded", "partially_refunded"],
} as const;

export const expenseStatuses = {
  counted: ["paid", "approved"],
  excluded: ["cancelled", "rejected", "draft"],
} as const;

export const payoutStatuses = {
  paid: ["paid"],
  pending: ["pending"],
  excluded: ["cancelled", "failed"],
} as const;

export const transportBookingStatuses = {
  counted: ["confirmed", "completed"],
  excluded: ["cancelled", "expired", "no_show"],
} as const;

export const tripStatuses = {
  counted: ["confirmed", "completed"],
  excluded: ["cancelled", "draft"],
} as const;

export const packageBookingStatuses = {
  counted: ["confirmed", "completed"],
  excluded: ["cancelled", "expired", "draft"],
} as const;
