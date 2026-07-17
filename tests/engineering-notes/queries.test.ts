import assert from "node:assert/strict";
import test from "node:test";
import {
  buildArchitectureDecisionWhere,
  buildDevelopmentLogWhere,
} from "../../lib/engineering-notes/queries";

test("開発日誌Whereへproject、tag、日付、Work、キーワードを追加する", () => {
  const where = buildDevelopmentLogWhere(
    {
      audience: "trusted-mcp",
      from: "2026-07-01",
      project: "my_profile",
      query: "フォーム",
      tags: ["payload", "payload", "forms"],
      to: "2026-07-31",
      visibility: "all",
    },
    10,
    "2026-07-17T00:00:00.000Z",
  );
  const serialized = JSON.stringify(where);

  assert.match(serialized, /"project":\{"equals":"my_profile"\}/);
  assert.match(serialized, /"tags.label":\{"in":\["payload","forms"\]\}/);
  assert.match(serialized, /greater_than_equal/);
  assert.match(serialized, /less_than_equal/);
  assert.match(serialized, /"relatedWorks":\{"equals":10\}/);
  assert.match(serialized, /"summary":\{"contains":"フォーム"\}/);
});

test("ADR WhereへdecisionStatusを追加する", () => {
  const where = buildArchitectureDecisionWhere({
    audience: "public-site",
    decisionStatus: "accepted",
  });

  assert.match(
    JSON.stringify(where),
    /"decisionStatus":\{"equals":"accepted"\}/,
  );
});

test("不正な日付はPayloadへ渡す前に拒否する", () => {
  assert.throws(
    () =>
      buildDevelopmentLogWhere({
        audience: "public-site",
        from: "not-a-date",
      }),
    RangeError,
  );
});
