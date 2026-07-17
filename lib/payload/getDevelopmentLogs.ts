import type { DevelopmentLogQuery } from "@/lib/engineering-notes/types";
import { queryDevelopmentLogs } from "@/lib/engineering-notes/queries";
import { getPayloadClient } from "@/lib/payload/client";

/**
 * 画面やMCPから利用する開発日誌の入口です。
 * audienceを必須引数にすることで、呼び出し側が公開範囲を意識せず取得する事故を防ぎます。
 */
export async function getDevelopmentLogs(input: DevelopmentLogQuery) {
  const payload = await getPayloadClient();

  if (!payload) {
    // Engineering Notesには静的fallbackを持たせず、CMS不在時は空配列にします。
    return [];
  }

  return queryDevelopmentLogs(payload, input);
}
