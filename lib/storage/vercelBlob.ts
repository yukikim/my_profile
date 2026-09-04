import { cloudStoragePlugin } from "@payloadcms/plugin-cloud-storage";
import type { Adapter } from "@payloadcms/plugin-cloud-storage/types";
import { del, put } from "@vercel/blob";
import type { Plugin } from "payload";

// The SDK resolves the current Vercel OIDC token for each operation. Never capture
// a deployment token at config/build time: runtime tokens are rotated by Vercel.
export function createBlobAdapter(
  storeId: string,
  blob = { put, del },
): Adapter {
  const id = storeId.trim().replace(/^store_/, "");
  if (!/^[a-z\d]+$/i.test(id)) {
    throw new Error("BLOB_STORE_ID must be a valid Vercel Blob store ID.");
  }
  const baseURL = `https://${id}.public.blob.vercel-storage.com`;
  const fileURL = (filename: string) =>
    `${baseURL}/${encodeURIComponent(filename)}`;

  return ({ collection }) => ({
    name: "vercel-blob-oidc",
    clientUploads: false,
    generateURL: ({ filename }) => fileURL(filename),
    handleUpload: async ({ data, file }) => {
      await blob.put(file.filename, file.buffer, {
        access: "public",
        storeId: id,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: file.mimeType,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      });
      return data;
    },
    handleDelete: async ({ filename }) => {
      await blob.del(fileURL(filename), { storeId: id });
    },
    // Media is public. Proxy the CDN response while retaining Payload's endpoint
    // and access checks, including range requests and conditional responses.
    staticHandler: async (req, { headers: incomingHeaders, params }) => {
      try {
        const requestHeaders = new Headers();
        for (const name of [
          "range",
          "if-none-match",
          "if-modified-since",
          "if-range",
        ]) {
          const value = req.headers.get(name);
          if (value) requestHeaders.set(name, value);
        }
        const response = await fetch(fileURL(params.filename), {
          headers: requestHeaders,
          cache: "no-store",
        });
        let headers = new Headers(incomingHeaders);
        for (const name of [
          "content-type",
          "content-length",
          "content-disposition",
          "content-range",
          "accept-ranges",
          "etag",
          "last-modified",
          "cache-control",
        ]) {
          const value = response.headers.get(name);
          if (value) headers.set(name, value);
        }
        if (
          response.headers.get("content-type")?.split(";")[0] ===
          "image/svg+xml"
        ) {
          headers.set("Content-Security-Policy", "script-src 'none'");
        }
        if (
          typeof collection.upload === "object" &&
          collection.upload.modifyResponseHeaders
        ) {
          headers =
            collection.upload.modifyResponseHeaders({ headers }) || headers;
        }
        return new Response(response.body, {
          status: response.status,
          headers,
        });
      } catch (err) {
        req.payload.logger.error({
          err,
          msg: "Unexpected error in Blob staticHandler",
        });
        return new Response("Internal Server Error", { status: 500 });
      }
    },
  });
}

export const vercelBlobStorage: Plugin = (config) => {
  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (!storeId) {
    if (process.env.VERCEL === "1") {
      throw new Error("BLOB_STORE_ID is required on Vercel.");
    }
    return config;
  }
  return cloudStoragePlugin({
    // No prefix field or client upload provider: keep the existing Media schema
    // and let Payload generate thumbnail/og images on the server.
    collections: { media: { adapter: createBlobAdapter(storeId) } },
  })(config);
};
