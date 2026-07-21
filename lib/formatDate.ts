// lib/formatDate.ts
const slashDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

/** Engineering Notes本文で読みやすい年月日表記に統一するformatterです。 */
const longDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export const formatSlashDate = (date: string) => {
  return slashDateFormatter.format(new Date(date));
};

/** CMSのISO 8601文字列をタイムゾーン差で日付がずれないUTC基準の日本語表記へ変換します。 */
export const formatLongDate = (date: string) => {
  return longDateFormatter.format(new Date(date));
};
