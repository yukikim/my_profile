import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEngineeringNoteVisibilityWhere,
  MAX_ENGINEERING_NOTES_LIMIT,
  normalizeEngineeringNotesLimit,
} from "../../lib/engineering-notes/visibility";

test("public-siteはprivate指定を受けてもpublicへ固定する", () => {
  const where = buildEngineeringNoteVisibilityWhere(
    "public-site",
    "private",
    "2026-07-17T00:00:00.000Z",
  );
  const serialized = JSON.stringify(where);

  assert.match(serialized, /"status":\{"equals":"published"\}/);
  assert.match(serialized, /"_status":\{"equals":"published"\}/);
  assert.match(serialized, /"visibility":\{"equals":"public"\}/);
  assert.doesNotMatch(serialized, /"visibility":\{"equals":"private"\}/);
  assert.match(serialized, /less_than_equal/);
});

test("trusted-mcpはprivateだけに絞り込める", () => {
  const where = buildEngineeringNoteVisibilityWhere("trusted-mcp", "private");

  assert.match(JSON.stringify(where), /"visibility":\{"equals":"private"\}/);
});

test("limitは1から最大値までに制限する", () => {
  assert.equal(normalizeEngineeringNotesLimit(0), 1);
  assert.equal(normalizeEngineeringNotesLimit(7.9), 7);
  assert.equal(
    normalizeEngineeringNotesLimit(MAX_ENGINEERING_NOTES_LIMIT + 100),
    MAX_ENGINEERING_NOTES_LIMIT,
  );
});
