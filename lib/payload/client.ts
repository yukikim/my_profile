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
    console.warn("Payload is unavailable. Falling back to local content.", error);
    return null;
  }
});
