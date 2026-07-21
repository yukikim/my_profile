import assert from "node:assert/strict";
import test from "node:test";
import { readPublishedEngineeringNote } from "../../access/readPublishedEngineeringNote";

/** Access型の関数部分だけをテストし、Payload Request全体のmockを不要にします。 */
const evaluateAccess = readPublishedEngineeringNote as (input: {
  req: { user: unknown };
}) => unknown;

test("未認証アクセスはpublished・public・公開日時到達済みに限定する", () => {
  const result = evaluateAccess({ req: { user: null } });
  const serialized = JSON.stringify(result);

  assert.match(serialized, /"status":\{"equals":"published"\}/);
  assert.match(serialized, /"visibility":\{"equals":"public"\}/);
  assert.match(serialized, /"publishedAt":\{"exists":false\}/);
  assert.match(serialized, /"publishedAt":\{"less_than_equal":/);
});

test("認証済み管理画面ユーザーは全件を読める", () => {
  assert.equal(evaluateAccess({ req: { user: { id: 1 } } }), true);
});
