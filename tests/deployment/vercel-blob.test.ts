import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { type TestContext } from "node:test";
import type { Config, PayloadRequest } from "payload";
import { Media } from "../../collections/Media";
import {
  createBlobAdapter,
  vercelBlobStorage,
} from "../../lib/storage/vercelBlob";

function setEnv(t: TestContext, name: string, value: string) {
  const previous = process.env[name];
  process.env[name] = value;
  t.after(() => {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  });
}

test("OIDC activates cloud storage without a read-write token or schema changes", async (t) => {
  setEnv(t, "VERCEL", "1");
  setEnv(t, "BLOB_STORE_ID", "store_teststore");
  setEnv(t, "BLOB_READ_WRITE_TOKEN", "");
  const config = await vercelBlobStorage({ collections: [Media] } as Config);
  const media = config.collections![0];
  assert.equal(
    typeof media.upload === "object" && media.upload.disableLocalStorage,
    true,
  );
  assert.equal(
    typeof media.upload === "object" && media.upload.adapter,
    "vercel-blob-oidc",
  );
  assert.deepEqual(
    media.fields.map((field) => "name" in field && field.name),
    [
      ...Media.fields.map((field) => "name" in field && field.name),
      "url",
      "sizes",
    ],
  );
  assert.deepEqual(
    typeof media.upload === "object" && media.upload.imageSizes,
    typeof Media.upload === "object" && Media.upload.imageSizes,
  );
  assert.equal(config.admin?.components?.providers, undefined);
});

test("local storage remains available but Vercel refuses a missing store", async (t) => {
  setEnv(t, "BLOB_STORE_ID", "");
  setEnv(t, "VERCEL", "");
  const config = { collections: [Media] } as Config;
  assert.equal(await vercelBlobStorage(config), config);
  setEnv(t, "VERCEL", "1");
  assert.throws(() => vercelBlobStorage(config), /BLOB_STORE_ID is required/);
  assert.throws(
    () => createBlobAdapter("https://wrong.example"),
    /valid Vercel Blob store ID/,
  );
});

test("upload and delete use the store ID without capturing an auth token", async () => {
  const calls: unknown[][] = [];
  const adapter = createBlobAdapter("store_teststore", {
    put: async (...args: unknown[]) => {
      calls.push(args);
      return {} as never;
    },
    del: async (...args: unknown[]) => {
      calls.push(args);
    },
  })({ collection: Media });
  const data = { alt: "image" };
  const buffer = Buffer.from("image");
  await adapter.handleUpload({
    data,
    file: {
      filename: "日本語 image.png",
      buffer,
      mimeType: "image/png",
      filesize: 5,
    },
    collection: Media,
    req: {} as PayloadRequest,
    clientUploadContext: undefined,
  });
  await adapter.handleDelete({
    filename: "日本語 image.png",
    collection: Media,
    doc: {
      id: 1,
      filename: "image.png",
      filesize: 5,
      height: 1,
      width: 1,
      mimeType: "image/png",
      sizes: {},
    },
    req: {} as PayloadRequest,
  });
  assert.deepEqual(calls[0], [
    "日本語 image.png",
    buffer,
    {
      access: "public",
      storeId: "teststore",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/png",
      cacheControlMaxAge: 31536000,
    },
  ]);
  assert.deepEqual(calls[1], [
    "https://teststore.public.blob.vercel-storage.com/%E6%97%A5%E6%9C%AC%E8%AA%9E%20image.png",
    { storeId: "teststore" },
  ]);
});

for (const status of [206, 304, 404]) {
  test(`image endpoint preserves CDN status ${status} and range/cache headers`, async (t) => {
    t.mock.method(
      globalThis,
      "fetch",
      async (url: string, options: RequestInit) => {
        assert.equal(
          url,
          "https://teststore.public.blob.vercel-storage.com/image.svg",
        );
        assert.equal(new Headers(options.headers).get("range"), "bytes=0-2");
        return new Response(status === 304 ? null : "svg", {
          status,
          headers: {
            "content-type": "image/svg+xml",
            etag: '"test"',
            "content-range": "bytes 0-2/3",
          },
        });
      },
    );
    const adapter = createBlobAdapter("teststore")({ collection: Media });
    const response = await adapter.staticHandler(
      { headers: new Headers({ range: "bytes=0-2" }) } as PayloadRequest,
      { params: { collection: "media", filename: "image.svg" } },
    );
    assert.equal(response.status, status);
    assert.equal(response.headers.get("etag"), '"test"');
    assert.equal(response.headers.get("content-range"), "bytes 0-2/3");
    assert.equal(
      response.headers.get("content-security-policy"),
      "script-src 'none'",
    );
  });
}

test("real Blob SDK sends OIDC auth and picks up a rotated token", async (t) => {
  setEnv(t, "BLOB_READ_WRITE_TOKEN", "");
  const token = (label: string) =>
    `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: label })).toString("base64url")}.test`;
  const first = token("first");
  const second = token("second");
  setEnv(t, "VERCEL_OIDC_TOKEN", first);
  const requests: Headers[] = [];
  // Intercept the SDK's own HTTP client and disallow real network requests.
  const require = createRequire(import.meta.url);
  const sdkRequire = createRequire(require.resolve("@vercel/blob"));
  const { MockAgent, getGlobalDispatcher, setGlobalDispatcher } =
    sdkRequire("undici");
  const previous = getGlobalDispatcher();
  const agent = new MockAgent();
  agent.disableNetConnect();
  setGlobalDispatcher(agent);
  t.after(async () => {
    setGlobalDispatcher(previous);
    await agent.close();
  });
  for (const method of ["PUT", "POST"]) {
    agent
      .get("https://vercel.com")
      .intercept({ path: /.*/, method })
      .reply((options: { headers: Record<string, string> }) => {
        requests.push(new Headers(options.headers));
        return {
          statusCode: 200,
          data: JSON.stringify({
            url: "https://teststore.public.blob.vercel-storage.com/image.png",
            pathname: "image.png",
            contentType: "image/png",
            contentDisposition: "inline",
          }),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      });
  }
  const adapter = createBlobAdapter("store_teststore")({ collection: Media });
  await adapter.handleUpload({
    data: {},
    file: {
      filename: "image.png",
      buffer: Buffer.from("image"),
      mimeType: "image/png",
      filesize: 5,
    },
    collection: Media,
    req: {} as PayloadRequest,
    clientUploadContext: undefined,
  });
  process.env.VERCEL_OIDC_TOKEN = second;
  await adapter.handleDelete({
    filename: "image.png",
    collection: Media,
    doc: {} as never,
    req: {} as PayloadRequest,
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].get("authorization"), `Bearer ${first}`);
  assert.equal(requests[1].get("authorization"), `Bearer ${second}`);
  for (const headers of requests)
    assert.equal(headers.get("x-vercel-blob-store-id"), "teststore");
});
