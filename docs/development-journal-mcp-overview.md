# 開発日誌・設計判断MCP 作業概要

## 1. 文書の目的

本書は、このプロフィールサイトに「開発日誌・設計判断MCP」を追加する作業の目的、対象範囲、完成イメージを定義する。

詳細な技術設計は [`development-journal-mcp-design.md`](./development-journal-mcp-design.md)、実装順と確認項目は [`development-journal-mcp-tasks.md`](./development-journal-mcp-tasks.md) を参照する。

## 2. 背景

現在のプロフィールサイトは、Next.js、Payload CMS、PostgreSQLで構成され、`Works`、`Posts`、`Pages` などのコンテンツを管理している。

実績や記事だけでは完成物は伝えられても、次の情報は継続的に蓄積・再利用しにくい。

- 何を実装し、どこで問題が発生したか
- 問題の原因をどう切り分け、どのように解決したか
- 複数の選択肢から、なぜ現在の設計を採用したか
- 過去の判断が現在の実装へどのような影響を与えているか
- 類似機能を追加するときに再利用すべき知識は何か

これらをPayload CMSで構造化して保存し、MCPサーバーから検索可能にする。CodexなどのMCPクライアントが、過去の実装経験と設計判断を踏まえた回答や提案を行える状態を目指す。

## 3. 目標

### 3.1 主目標

1. 開発日誌を `DevelopmentLogs` Collectionで管理できるようにする。
2. ADR（Architecture Decision Record）を `ArchitectureDecisions` Collectionで管理できるようにする。
3. MCPクライアントから、公開済みの開発日誌と設計判断を読み取り専用で検索できるようにする。
4. 公開可能な記録だけを、プロフィールサイトの「Engineering Notes」として閲覧できるようにする。
5. 非公開情報、下書き、認証情報が公開サイトやMCPの応答へ混入しないようにする。

### 3.2 学習上の目標

- PayloadのCollection、relationship、access control、migrationを実践する。
- MCPのTools、入力スキーマ、構造化出力、transportを実践する。
- 人間向け画面とAI向けインターフェースを、同じデータソースから安全に提供する。
- 「保存するデータ」と「AIへ返してよいデータ」の境界を設計する。

## 4. 完成イメージ

```text
Payload Admin (/admin)
├─ DevelopmentLogs
└─ ArchitectureDecisions
          │
          ▼
PostgreSQL
     ┌────┴────────────────────┐
     ▼                         ▼
Next.js公開サイト          読み取り専用MCPサーバー
Engineering Notes          stdio（初期構成）
publicのみ                 public + private
                               │
                               ▼
                         CodexなどのMCPクライアント
```

管理者はPayload管理画面から記録を入力する。公開サイトは「公開済みかつ `public`」の記録だけを表示する。MCPはローカルの信頼されたプロセスとして動作し、「公開済み」の `public` と `private` を検索対象にする。下書きはPayload管理画面だけで扱う。

## 5. 利用例

MCP接続後は、次のような質問へ構造化された記録を使って回答できるようにする。

- `my_profileでPostgreSQLを採用した理由を教えてください。`
- `問い合わせフォームの実装時に発生した問題と解決方法を一覧にしてください。`
- `Works取得処理のフォールバック設計に関係するADRを探してください。`
- `このプロジェクトで直近に行った作業と、次にやることを教えてください。`
- `過去の設計判断と矛盾しない形で、新機能の実装方針を提案してください。`

## 6. 初期リリース範囲（MVP）

### 対象

- `DevelopmentLogs` Collection
- `ArchitectureDecisions` Collection
- `Works` とのrelationship
- 公開状態と公開範囲によるアクセス制御
- Payload Local APIを利用する共通検索処理
- stdioで動作する読み取り専用MCPサーバー
- 6個の読み取り専用MCP Tool
- MCPの単体確認とCodexからの接続確認
- 公開可能な記録を表示するEngineering Notes画面
- Collection、検索処理、MCP応答のテスト

### 初期リリース対象外

- MCPからの直接公開
- 自動承認される書き込み処理
- Git履歴、Issue、コミットからの日誌自動生成
- 複数利用者向けの権限管理
- インターネットへ公開するリモートMCPサーバー
- OAuth認証を伴うStreamable HTTP transport
- ベクトルDBやEmbeddingによるセマンティック検索

## 7. 段階的な拡張方針

### Phase 1: データを安全に蓄積する

2つのCollection、アクセス制御、migrationを実装し、Payload管理画面から手入力できるようにする。

### Phase 2: MCPから読み取る

ローカルのstdio MCPサーバーを実装し、キーワード、プロジェクト、日付、関連Workなどで検索できるようにする。

### Phase 3: 公開サイトで見せる

`public` の記録だけをEngineering Notesとして表示し、実績ページから関連する日誌やADRへ移動できるようにする。

### Phase 4: 下書き作成を支援する

Git履歴などから下書きを生成するToolを追加する。MCPから作成する場合も、必ずPayloadの下書きとして保存し、管理画面で人が確認してから公開する。

### Phase 5: 必要な場合だけリモート化する

外部のMCPクライアントから利用する明確な要件が生じた場合に、Streamable HTTP、OAuth 2.1、監査ログ、レート制限を設計する。

## 8. 成功条件

- 管理画面で開発日誌とADRを作成、編集、下書き保存、公開できる。
- ADRと開発日誌を既存の `Works` に関連付けられる。
- 未認証のPayload APIと公開サイトから `private` または下書きを取得できない。
- MCPから下書きを取得できない。
- MCPの各Toolが入力スキーマに従い、件数上限付きの構造化データを返す。
- MCP応答にDB接続情報、secret、顧客情報などの禁止情報が含まれない。
- Codexから代表的な質問を行い、該当する開発日誌またはADRを取得できる。
- lint、typecheck、build、関連テストが成功する。

## 9. 設計上の重要な判断

- データの正本はMarkdownファイルではなくPayload/PostgreSQLとする。
- 公開状態と公開範囲を分離する。
  - 公開状態: `draft` / `published`
  - 公開範囲: `public` / `private`
- ADR自体の状態は `decisionStatus` とし、公開状態の `status` と混同しない。
- 初期MCPはローカルstdio、読み取り専用とする。
- MCP応答はCollectionの生データをそのまま返さず、許可したフィールドだけを返す。
- 検索結果には上限を設け、巨大な本文を無制限にコンテキストへ渡さない。
- 公開サイトとMCPで検索条件を共有しつつ、閲覧可能範囲は呼び出し元ごとに分ける。

