import { queryArchitectureDecisions } from "@/lib/engineering-notes/queries";
import type { ArchitectureDecisionQuery } from "@/lib/engineering-notes/types";
import { getPayloadClient } from "@/lib/payload/client";

/**
 * 画面やMCPから利用するADR検索の入口です。
 * Payload初期化と検索条件の組み立てを分け、Query Serviceを単体テスト可能に保ちます。
 */
export async function getArchitectureDecisions(
  input: ArchitectureDecisionQuery,
) {
  const payload = await getPayloadClient();

  if (!payload) {
    return [];
  }

  return queryArchitectureDecisions(payload, input);
}
