import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import config from "@payload-config";
import type { ServerFunctionClient, ServerFunctionClientArgs } from "payload";
import { importMap } from "./admin/importMap";

const serverFunction: ServerFunctionClient = async (
  args: ServerFunctionClientArgs,
) => {
  "use server";

  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

export default function PayloadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return RootLayout({
    children,
    config,
    importMap,
    serverFunction,
  });
}
