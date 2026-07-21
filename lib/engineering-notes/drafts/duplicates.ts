import type { Payload } from "payload";
import type { ArchitectureDecision, DevelopmentLog } from "@/payload-types";
import type { EngineeringNoteDraft } from "./types";
import { EngineeringNoteDatabaseError } from "./errors";

export type DuplicateEngineeringNote = {
  collection: "development-logs" | "architecture-decisions";
  field: "slug" | "decisionId";
  id: number;
  slug: string;
  decisionId?: string;
};

/** 重複例外にも既存本文を含めず、登録を止める判断に必要な識別子だけを保持します。 */
export class DuplicateEngineeringNoteError extends Error {
  readonly code = "DUPLICATE_ENGINEERING_NOTE" as const;

  constructor(readonly duplicates: readonly DuplicateEngineeringNote[]) {
    super("An Engineering Note with the same identifier already exists.");
    this.name = "DuplicateEngineeringNoteError";
  }
}

type LookupPayload = Pick<Payload, "find">;

async function safeFind<TDocument>(
  payload: LookupPayload,
  args: Parameters<Payload["find"]>[0],
) {
  try {
    // Payload.findのoverloadをhelper越しに呼ぶとcollection固有型がunionへ広がるため、
    // 呼び出し側で指定した生成Document型へ、このDB境界でだけ絞り直します。
    return (await payload.find(args)) as unknown as { docs: TDocument[] };
  } catch {
    // 元のDB例外を文字列化しないことが、接続情報やSQLを漏らさない重要な境界です。
    throw new EngineeringNoteDatabaseError();
  }
}

export async function findEngineeringNoteDuplicates(
  payload: LookupPayload,
  draft: EngineeringNoteDraft,
) {
  if (draft.kind === "development-log") {
    const result = await safeFind<DevelopmentLog>(payload, {
      collection: "development-logs",
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: draft.slug } },
    });
    const existing = result.docs[0];

    return existing
      ? [
          {
            collection: "development-logs",
            field: "slug",
            id: existing.id,
            slug: existing.slug,
          } satisfies DuplicateEngineeringNote,
        ]
      : [];
  }

  const [slugResult, decisionIdResult] = await Promise.all([
    safeFind<ArchitectureDecision>(payload, {
      collection: "architecture-decisions",
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: draft.slug } },
    }),
    safeFind<ArchitectureDecision>(payload, {
      collection: "architecture-decisions",
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: { decisionId: { equals: draft.decisionId } },
    }),
  ]);

  const duplicates: DuplicateEngineeringNote[] = [];
  for (const [field, existing] of [
    ["slug", slugResult.docs[0]],
    ["decisionId", decisionIdResult.docs[0]],
  ] as const) {
    if (existing) {
      duplicates.push({
        collection: "architecture-decisions",
        field,
        id: existing.id,
        slug: existing.slug,
        decisionId: existing.decisionId,
      });
    }
  }

  return duplicates;
}

/** create-onlyを保証する入口です。重複時にupdateやupsertへ分岐せず必ず停止します。 */
export async function assertEngineeringNoteIsNew(
  payload: LookupPayload,
  draft: EngineeringNoteDraft,
) {
  const duplicates = await findEngineeringNoteDuplicates(payload, draft);
  if (duplicates.length > 0) {
    throw new DuplicateEngineeringNoteError(duplicates);
  }
}
