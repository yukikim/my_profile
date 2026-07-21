export type SensitiveContentSeverity = "block" | "warning";

export type SensitiveContentReason =
  | "credential-value"
  | "database-connection-string"
  | "environment-value"
  | "private-key"
  | "credential-keyword"
  | "long-content"
  | "stack-trace"
  | "source-code";

/** 本文や一致文字列を持たせず、利用者が確認すべき場所と理由だけを返します。 */
export type SensitiveContentFinding = {
  path: string;
  reason: SensitiveContentReason;
  severity: SensitiveContentSeverity;
};

const LONG_CONTENT_CHARACTERS = 4_000;
const SOURCE_CODE_LINE_COUNT = 20;

const blockingRules: ReadonlyArray<{
  reason: SensitiveContentReason;
  pattern: RegExp;
}> = [
  {
    reason: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  },
  {
    reason: "database-connection-string",
    pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s]+/i,
  },
  {
    reason: "environment-value",
    pattern:
      /(?:^|\n)\s*(?:export\s+)?[A-Z][A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_KEY|DATABASE_URI|DATABASE_URL)[A-Z0-9_]*\s*=\s*[^\s#]+/i,
  },
  {
    reason: "credential-value",
    pattern:
      /\b(?:password|passwd|secret|token|api[_ -]?key)\b\s*[:=]\s*["']?[^\s"']{8,}/i,
  },
  {
    reason: "credential-value",
    pattern:
      /\b(?:sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16})\b/,
  },
];

const credentialKeywordPattern =
  /\b(?:password|passwd|secret|token|api[_ -]?key)\b/i;
const environmentAssignmentPattern =
  /(?:^|\n)\s*(?:export\s+)?[A-Z_][A-Z0-9_]*\s*=\s*(?:["'][^"'\n]+["']|[^\s#]+)/i;

function fieldPath(parent: string, key: string) {
  // 未知のobject key自体に秘密値が入っていても、path経由で漏らさないため安全な名前だけを表示します。
  return /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(key)
    ? `${parent}.${key}`
    : `${parent}.<field>`;
}

function inspectString(value: string, path: string) {
  const findings: SensitiveContentFinding[] = [];

  for (const rule of blockingRules) {
    if (rule.pattern.test(value)) {
      findings.push({ path, reason: rule.reason, severity: "block" });
    }
  }

  if (
    credentialKeywordPattern.test(value) &&
    !findings.some((finding) => finding.reason === "credential-value")
  ) {
    findings.push({
      path,
      reason: "credential-keyword",
      severity: "warning",
    });
  }

  if (
    environmentAssignmentPattern.test(value) &&
    !findings.some((finding) => finding.reason === "environment-value")
  ) {
    // 一般的な.env行は秘密とは限らないため警告、秘密名を持つ.env行は上のruleで即時拒否します。
    findings.push({
      path,
      reason: "environment-value",
      severity: "warning",
    });
  }

  if (value.length >= LONG_CONTENT_CHARACTERS) {
    findings.push({ path, reason: "long-content", severity: "warning" });
  }

  const lines = value.split(/\r?\n/);
  const stackLines = lines.filter((line) => /^\s*at\s+\S+/.test(line)).length;
  if (
    stackLines >= 2 ||
    (/\b(?:Error|Exception):/.test(value) && stackLines >= 1)
  ) {
    findings.push({ path, reason: "stack-trace", severity: "warning" });
  }

  const codeSignals = lines.filter((line) =>
    /^\s*(?:import |export |package |func |class |interface |const |let |var |def )/.test(
      line,
    ),
  ).length;
  if (lines.length >= SOURCE_CODE_LINE_COUNT && codeSignals >= 3) {
    findings.push({ path, reason: "source-code", severity: "warning" });
  }

  return findings;
}

/**
 * 入れ子objectと配列を再帰的にたどり、すべての文字列値を検査します。
 * WeakSetで循環参照も止めるため、将来JSON以外のobjectから呼んでも無限再帰しません。
 */
export function inspectSensitiveContent(input: unknown) {
  const findings: SensitiveContentFinding[] = [];
  const visited = new WeakSet<object>();

  const visit = (value: unknown, path: string): void => {
    if (typeof value === "string") {
      findings.push(...inspectString(value, path));
      return;
    }

    if (value === null || typeof value !== "object" || visited.has(value)) {
      return;
    }

    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      visit(child, fieldPath(path, key));
    }
  };

  visit(input, "$");
  return findings;
}

export function hasBlockingSensitiveContent(
  findings: readonly SensitiveContentFinding[],
) {
  return findings.some((finding) => finding.severity === "block");
}
