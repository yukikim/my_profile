import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** クライアントが処理方針を判断できる、安全な公開用エラーコードです。 */
export type McpToolErrorCode = "INVALID_INPUT" | "NOT_FOUND" | "QUERY_FAILED";

/**
 * 想定内の失敗を、安全なコードとメッセージで表すエラーです。
 * 元のDBエラーをそのまま外へ出さないため、causeは応答に含めません。
 */
export class EngineeringNotesMcpError extends Error {
  constructor(
    readonly code: McpToolErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "EngineeringNotesMcpError";
  }
}

/** 内部エラーを、接続文字列・SQL・stack traceを含まないToolエラーへ変換します。 */
export function toSafeToolError(error: unknown): EngineeringNotesMcpError {
  if (error instanceof EngineeringNotesMcpError) {
    return error;
  }

  if (error instanceof RangeError) {
    return new EngineeringNotesMcpError(
      "INVALID_INPUT",
      "検索条件の日付が正しくありません。ISO 8601形式で指定してください。",
      { cause: error },
    );
  }

  return new EngineeringNotesMcpError(
    "QUERY_FAILED",
    "Engineering Notesを取得できませんでした。サーバーの状態を確認してください。",
    { cause: error },
  );
}

/** MCPのエラー結果を生成します。秘密情報を混ぜないため、公開用プロパティだけをJSON化します。 */
export function createErrorToolResult(error: unknown): CallToolResult {
  const safeError = toSafeToolError(error);
  const body = {
    error: {
      code: safeError.code,
      message: safeError.message,
    },
  };

  return {
    content: [{ type: "text", text: JSON.stringify(body) }],
    isError: true,
  };
}
