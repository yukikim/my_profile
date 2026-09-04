import { cache } from "react";
import config from "@payload-config";
import { getPayload, type Payload } from "payload";

export const getPayloadClient = cache(async (): Promise<Payload | null> => {
  if (!process.env.DATABASE_URI) {
    return null;
  }

  try {
    return await getPayload({ config });
  } catch (error) {
    // 本番でDB接続失敗をサンプルコンテンツとして公開しないようにします。
    if (process.env.VERCEL === "1") throw error;
    console.warn(
      "Payload is unavailable. Falling back to local content.",
      error,
    );
    return null;
  }
});
