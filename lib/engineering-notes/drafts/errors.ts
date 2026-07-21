/**
 * DBドライバーの例外は接続文字列、SQL、入力本文を含む可能性があります。
 * 境界の外へは固定文言だけを持つこのエラーへ変換し、元の例外をcauseにも残しません。
 */
export class EngineeringNoteDatabaseError extends Error {
  readonly code = "DATABASE_UNAVAILABLE" as const;

  constructor() {
    super("Engineering Notes database lookup is unavailable.");
    this.name = "EngineeringNoteDatabaseError";
  }
}
