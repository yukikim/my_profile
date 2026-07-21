# Engineering Notes 下書き作成用 Codex 依頼テンプレート

## 1. 使い方

この文書は、実装・調査結果を Development Log または Architecture Decision Record（ADR）の下書きへ整理するときに使用する。

1. 最初に「種別判断チェック」を埋める。
2. 選んだ種別の依頼テンプレートへ、確認できた事実と根拠を渡す。
3. Codex の出力を根拠と照合する。
4. Payload Admin へ `status: draft`、`visibility: private`、Payload の公開状態も Draft として手動登録する。

> 学習ポイント: Development Log は「何を実施し、どう確認したか」、ADR は「なぜその方針を選んだか」を残す。実施記録と設計判断を分けると、後から原因や判断理由だけを検索しやすい。

## 2. 種別判断チェック

次を確認してから依頼する。

- [ ] 実際に変更、調査、修正、検証した内容を時系列または結果として残したい。
  - 該当する場合は Development Log を作成する。
- [ ] 複数の候補を比較し、今後の実装にも影響する方針を選んだ理由を残したい。
  - 該当する場合は ADR を作成する。
- [ ] 実装作業の中で長期的な設計方針も決めた。
  - 該当する場合は Development Log と ADR を1件ずつ作り、relationship で関連付ける。
- [ ] 候補比較や長期的な影響がなく、単に作業結果だけを記録したい。
  - ADR は作らず、Development Log だけを作成する。
- [ ] 作業も判断もまだ完了しておらず、根拠が揃っていない。
  - 下書きには未確認事項を明記し、完了した事実のように書かない。

## 3. 共通入力情報

依頼時に、最低限次を渡す。

```text
project（Payloadへ保存する固定名）:
プロジェクト表示名:
repository名または参照用path:
作業日または判断日（ISO 8601）:
対象範囲（機能、Issue、ファイル）:

確認できた事実:
-

根拠:
- commit / diff:
- test / build / lint結果:
- error message:
- Issue / 仕様書:

relationship候補:
- Work slug:
- Development Log slug:
- ADR ID:

未確認事項:
-
```

repository の絶対 path は Codex が根拠を読むためだけに使い、原則として保存本文へ含めない。

## 4. 保存禁止情報

次の情報を下書きへ含めない。根拠ファイルやログに含まれる場合は値を転記せず、「秘密情報を除外した」とだけ示す。

- API key、access token、password、secret、cookie、session情報
- `DATABASE_URI` などの接続文字列と `.env` の値
- 秘密鍵、署名鍵、認証コード
- 顧客名、メールアドレスなど、公開許可を確認できない個人情報
- 非公開URL、内部ホスト名、利用者固有の絶対path
- 未修正の脆弱性を悪用できる具体的手順
- 必要性のないソースコード全文、長大なログ、stack trace全文

## 5. Development Log 依頼テンプレート

```text
以下の入力情報と根拠だけを使い、my_profile の Payload Admin へ手動登録する
Development Log 1件の下書きを日本語で作成してください。

[共通入力情報を貼る]

規則:
- title、slug、logDate、project、summaryを必ず出す。
- 必要に応じてimplementation、problem、cause、resolution、lessonsLearned、nextActions、
  related Work slug、related ADR ID、tagsを出す。
- slugは「<project>-<action-or-topic>」のlowercase-kebab-caseにする。
- 作業差分、テスト結果、エラー内容から確認できないことを推測で補完しない。
- 不明な値は「未確認」と明記し、確認方法をnextActionsへ入れる。
- error messageは原因の識別に必要な短い部分だけを要約する。
- repositoryの絶対pathと保存禁止情報を本文へ含めない。
- status、visibility、Payloadの公開状態は出力本文で変更候補にせず、
  登録時の固定値「draft / private / Draft」として最後に確認欄を出す。
- relationshipはDB IDではなく、Work slugまたはADR IDで示す。
- 出力の最後に「根拠との照合」「秘密情報」「重複slug」「relationship」のレビュー欄を付ける。
```

## 6. ADR 依頼テンプレート

```text
以下の入力情報と根拠だけを使い、my_profile の Payload Admin へ手動登録する
Architecture Decision Record（ADR）1件の下書きを日本語で作成してください。

[共通入力情報を貼る]

規則:
- decisionId、title、slug、project、decisionStatus、context、options、decision、rationaleを必ず出す。
- 必要に応じてpositiveConsequences、negativeConsequences、decidedAt、supersedes ADR ID、
  related Work slug、related Development Log slug、tagsを出す。
- decisionIdは「<PROJECT>-ADR-<4桁連番>」とし、既存IDとの重複確認が必要だと明記する。
- slugは「<project>-<decision-topic>」のlowercase-kebab-caseにする。
- optionsは実際に比較した候補だけを最低1件出し、各候補のprosとconsを分ける。
- 比較、採用理由、影響を根拠から確認できない場合は推測で補完せず「未確認」と示す。
- decisionStatusはproposed、accepted、supersededのいずれかに限定する。
- repositoryの絶対pathと保存禁止情報を本文へ含めない。
- status、visibility、Payloadの公開状態は出力本文で変更候補にせず、
  登録時の固定値「draft / private / Draft」として最後に確認欄を出す。
- relationshipはDB IDではなく、ADR ID、Development Log slug、Work slugで示す。
- 出力の最後に「根拠との照合」「秘密情報」「重複slug / decisionId」「relationship」のレビュー欄を付ける。
```

## 7. 登録前レビュー

- [ ] title と summary または context だけで対象と結果が理解できる。
- [ ] 実装内容、問題、原因、解決方法を混同していない。
- [ ] 推測を事実として記載していない。
- [ ] commit、diff、テスト結果、エラー内容と矛盾しない。
- [ ] 保存禁止情報を含まない。
- [ ] `project` は既存表記と一致する。
- [ ] slug と ADR ID は既存Documentと衝突しない。
- [ ] relationship候補を人が理解できる識別子で確認した。
- [ ] 公開可否をまだ判断していない場合は `private` のままにする。
- [ ] 保存時に `status: draft`、`visibility: private`、Payload Draft の3状態を確認する。

> 学習ポイント: `decisionStatus` は設計判断が提案中か採用済みかを表し、`status` と Payload Draft はコンテンツの公開状態を表す。役割が異なるため、ADRが `accepted` でも、レビュー前は `status: draft` と Payload Draft のまま保存する。
