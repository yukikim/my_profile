import type { Where } from "payload";
import type {
  EngineeringNotesAudience,
  EngineeringNoteVisibility,
} from "./types";

/** 無指定時に返す件数です。AIのコンテキストを不必要に消費しない値にします。 */
export const DEFAULT_ENGINEERING_NOTES_LIMIT = 10;

/** 一度の問い合わせで取得できる最大件数です。 */
export const MAX_ENGINEERING_NOTES_LIMIT = 50;

/**
 * 呼び出し側のlimitを安全な整数範囲へ丸めます。
 * 型を迂回したNaNやInfinityが渡っても、Payloadへ不正な値を渡しません。
 */
export function normalizeEngineeringNotesLimit(limit?: number) {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_ENGINEERING_NOTES_LIMIT;
  }

  return Math.min(
    MAX_ENGINEERING_NOTES_LIMIT,
    Math.max(1, Math.trunc(limit)),
  );
}

/**
 * 公開状態に関する必須条件を構築します。
 * 呼び出し側の追加条件とは別に生成することで、public-siteがprivateやdraftを
 * 指定しても、この境界を上書きできない構造にします。
 */
export function buildEngineeringNoteVisibilityWhere(
  audience: EngineeringNotesAudience,
  requestedVisibility: EngineeringNoteVisibility = "all",
  now = new Date().toISOString(),
): Where {
  const conditions: Where[] = [
    {
      status: {
        equals: "published",
      },
    },
    {
      // `_status`はPayload versionsが管理する公開状態です。
      _status: {
        equals: "published",
      },
    },
    {
      or: [
        {
          publishedAt: {
            exists: false,
          },
        },
        {
          publishedAt: {
            less_than_equal: now,
          },
        },
      ],
    },
  ];

  if (audience === "public-site") {
    // public-siteではrequestedVisibilityを信用せず、常にpublicへ固定します。
    conditions.push({
      visibility: {
        equals: "public",
      },
    });
  } else if (requestedVisibility !== "all") {
    conditions.push({
      visibility: {
        equals: requestedVisibility,
      },
    });
  }

  return { and: conditions };
}
