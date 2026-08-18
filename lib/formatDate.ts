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

/** 開始月と終了月を含めた期間を、月単位の概算で表示します。 */
export const formatApproximateMonthDuration = (
  startDate: string,
  endDate: string,
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    start.getUTCMonth() +
    1;

  if (months > 12) {
    return `約${Math.floor(months / 12)}年${months % 12}ヶ月`;
  }

  return `約${months}ヶ月`;
};

/** CMSのISO 8601文字列をタイムゾーン差で日付がずれないUTC基準の日本語表記へ変換します。 */
export const formatLongDate = (date: string) => {
  return longDateFormatter.format(new Date(date));
};
