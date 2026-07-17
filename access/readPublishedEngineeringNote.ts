import type { Access, Where } from "payload";

/**
 * Engineering Notesの閲覧範囲を決めるCollection共通のアクセス制御です。
 *
 * Payloadのaccess関数はbooleanだけでなくWhere条件も返せます。認証済みの
 * 管理ユーザーには全件を許可し、未認証ユーザーには公開可能なレコードだけが
 * DB検索の段階で残る条件を返すことで、privateな内容の取得を防ぎます。
 */
export const readPublishedEngineeringNote: Access = ({ req: { user } }) => {
  if (user) {
    return true;
  }

  // 判定時刻を一度だけ生成し、同じアクセス判定内で時刻がずれないようにします。
  const now = new Date().toISOString();

  // Where型を明示すると、各and要素が別形状でもPayloadの検索条件として検証されます。
  const publiclyReadableRecords: Where = {
    and: [
      {
        status: {
          equals: "published",
        },
      },
      {
        visibility: {
          equals: "public",
        },
      },
      {
        or: [
          {
            publishedAt: {
              exists: false,
            },
          },
          {
            publishedAt: {
              less_than_equal: now,
            },
          },
        ],
      },
    ],
  };

  return publiclyReadableRecords;
};
