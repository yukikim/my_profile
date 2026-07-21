/**
 * 配列の順序を維持したまま重複を除きます。
 * relationshipやtagは入力順にもレビュー上の意味があるため、sortは行いません。
 */
export function normalizeUniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()))];
}

/**
 * Date.parseだけでは「2026-07-21」のような曖昧な値も受理するため、
 * timezoneを含むISO 8601 datetimeであることを形式と実在日時の両方から確認します。
 */
export function isIso8601DateTime(value: string) {
  const isoDateTimePattern =
    /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00))$/;
  const match = isoDateTimePattern.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  // Date.parseが2月30日を3月へ繰り上げても、入力値との比較で実在しない日付を拒否します。
  const isRealCalendarDate =
    calendarDate.getUTCFullYear() === year &&
    calendarDate.getUTCMonth() === month - 1 &&
    calendarDate.getUTCDate() === day;

  return isRealCalendarDate && !Number.isNaN(Date.parse(value));
}
