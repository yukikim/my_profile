import type { Payload } from "payload";
import type { EngineeringNoteDraft } from "./types";
import { EngineeringNoteDatabaseError } from "./errors";

type RelationshipKind = "work" | "development-log" | "architecture-decision";

export type RelationshipWarning = {
  code: "RELATION_NOT_FOUND";
  path: string;
  relation: RelationshipKind;
  identifier: string;
};

export type ResolvedEngineeringNoteRelationships = {
  relatedWorkIds: number[];
  relatedDevelopmentLogIds: number[];
  relatedArchitectureDecisionIds: number[];
  supersedesArchitectureDecisionId?: number;
  warnings: RelationshipWarning[];
};

export class RelationshipIntegrityError extends Error {
  readonly code = "RELATION_DATA_INTEGRITY" as const;

  constructor(
    readonly detail: {
      path: string;
      relation: RelationshipKind;
      identifier: string;
      matchCount: number;
    },
  ) {
    super("Multiple documents matched one relationship identifier.");
    this.name = "RelationshipIntegrityError";
  }
}

type LookupPayload = Pick<Payload, "find">;
type CollectionSlug = "works" | "development-logs" | "architecture-decisions";

async function resolveOne(
  payload: LookupPayload,
  input: {
    collection: CollectionSlug;
    field: "slug" | "decisionId";
    identifier: string;
    path: string;
    relation: RelationshipKind;
  },
) {
  let docs: Array<{ id: number }>;
  try {
    // limit: 2は「一意な1件」と「壊れた複数件」を最小の読込量で区別するためです。
    const result = await payload.find({
      collection: input.collection,
      depth: 0,
      draft: true,
      limit: 2,
      overrideAccess: true,
      where: { [input.field]: { equals: input.identifier } },
    });
    docs = result.docs;
  } catch {
    throw new EngineeringNoteDatabaseError();
  }

  if (docs.length > 1) {
    throw new RelationshipIntegrityError({
      path: input.path,
      relation: input.relation,
      identifier: input.identifier,
      matchCount: docs.length,
    });
  }

  return docs[0]?.id;
}

async function resolveMany(
  payload: LookupPayload,
  identifiers: readonly string[] | undefined,
  input: {
    collection: CollectionSlug;
    field: "slug" | "decisionId";
    path: string;
    relation: RelationshipKind;
  },
) {
  const ids: number[] = [];
  const warnings: RelationshipWarning[] = [];

  for (const [index, identifier] of (identifiers ?? []).entries()) {
    const path = `${input.path}[${index}]`;
    const id = await resolveOne(payload, { ...input, identifier, path });
    if (id === undefined) {
      // 参照先がない外部プロジェクトも登録可能にし、確認材料だけをwarningとして返します。
      warnings.push({
        code: "RELATION_NOT_FOUND",
        path,
        relation: input.relation,
        identifier,
      });
    } else {
      ids.push(id);
    }
  }

  return { ids, warnings };
}

/** 入力識別子をPayload IDへ変換し、後続のcreate処理がDB検索を重複実装しないようにします。 */
export async function resolveEngineeringNoteRelationships(
  payload: LookupPayload,
  draft: EngineeringNoteDraft,
): Promise<ResolvedEngineeringNoteRelationships> {
  const works = await resolveMany(payload, draft.relatedWorkSlugs, {
    collection: "works",
    field: "slug",
    path: "$.relatedWorkSlugs",
    relation: "work",
  });

  if (draft.kind === "development-log") {
    const decisions = await resolveMany(payload, draft.relatedDecisionIds, {
      collection: "architecture-decisions",
      field: "decisionId",
      path: "$.relatedDecisionIds",
      relation: "architecture-decision",
    });

    return {
      relatedWorkIds: works.ids,
      relatedDevelopmentLogIds: [],
      relatedArchitectureDecisionIds: decisions.ids,
      warnings: [...works.warnings, ...decisions.warnings],
    };
  }

  const logs = await resolveMany(payload, draft.relatedLogSlugs, {
    collection: "development-logs",
    field: "slug",
    path: "$.relatedLogSlugs",
    relation: "development-log",
  });

  let supersedesArchitectureDecisionId: number | undefined;
  const warnings = [...works.warnings, ...logs.warnings];
  if (draft.supersedesDecisionId) {
    supersedesArchitectureDecisionId = await resolveOne(payload, {
      collection: "architecture-decisions",
      field: "decisionId",
      identifier: draft.supersedesDecisionId,
      path: "$.supersedesDecisionId",
      relation: "architecture-decision",
    });
    if (supersedesArchitectureDecisionId === undefined) {
      warnings.push({
        code: "RELATION_NOT_FOUND",
        path: "$.supersedesDecisionId",
        relation: "architecture-decision",
        identifier: draft.supersedesDecisionId,
      });
    }
  }

  return {
    relatedWorkIds: works.ids,
    relatedDevelopmentLogIds: logs.ids,
    relatedArchitectureDecisionIds: [],
    supersedesArchitectureDecisionId,
    warnings,
  };
}
