export const COMMERCIAL_DATA_RETENTION_DAYS = Object.freeze({
  anonymousMessages: 30,
  anonymousTechnicalData: 90,
});

export const COMMERCIAL_LEAD_RETENTION_MONTHS = 12;

export function getCommercialRetentionCutoffs(referenceDate = new Date()) {
  const referenceMs = referenceDate instanceof Date ? referenceDate.getTime() : NaN;
  if (!Number.isFinite(referenceMs)) {
    throw new TypeError('referenceDate must be a valid Date');
  }

  const daysBefore = (days) =>
    new Date(referenceMs - days * 24 * 60 * 60 * 1000).toISOString();

  const leadCutoff = new Date(referenceMs);
  leadCutoff.setUTCMonth(
    leadCutoff.getUTCMonth() - COMMERCIAL_LEAD_RETENTION_MONTHS
  );

  return {
    anonymousMessagesBefore: daysBefore(COMMERCIAL_DATA_RETENTION_DAYS.anonymousMessages),
    anonymousTechnicalDataBefore: daysBefore(
      COMMERCIAL_DATA_RETENTION_DAYS.anonymousTechnicalData
    ),
    prospectiveLeadsBefore: leadCutoff.toISOString(),
  };
}
