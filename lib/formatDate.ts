// lib/formatDate.ts
const slashDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

export const formatSlashDate = (date: string) => {
  return slashDateFormatter.format(new Date(date));
};