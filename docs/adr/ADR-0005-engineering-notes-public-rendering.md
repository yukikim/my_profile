# ADR-0005: Engineering Notes公開画面はServer ComponentとISRで実装する

- 状態: Accepted
- 決定日: 2026-07-21
- 対象: `/engineering-notes`以下の公開画面

## 背景

Engineering NotesはPayload Local APIから取得するため、DB接続情報と公開判定をブラウザへ渡さず、CMS更新も一定時間内に公開画面へ反映したい。現在の`next.config.ts`ではNext.js 16のCache Componentsを有効にしていない。

## 決定

- App RouterのServer Componentから`public-site`向けQuery Serviceを呼び出す。
- 一覧と詳細routeは`revalidate = 300`を指定し、5分間隔のISRを利用する。
- metadataと本文で共有する取得関数はReactの`cache()`で同一render内の重複を避ける。
- 詳細routeは`generateStaticParams()`でbuild時点の公開slugを生成し、新規slugは初回アクセス時にも生成可能にする。
- slugが公開Queryで見つからない場合は`notFound()`を呼び、private、draft、未来公開データの存在を画面へ漏らさない。

## 理由

Server ComponentならPayload Local APIをサーバー内に閉じ込められる。ISRによりリクエストごとのDB検索を避けながら、再buildなしでCMS更新を反映できる。既存設定へCache Componentsを追加する変更は影響範囲が広いため、このPhaseでは採用しない。

## 影響

- 公開後の反映には最大約5分かかる。
- 即時反映が必要になった場合は、将来Payload hookから`revalidateTag`または`revalidatePath`を呼ぶ方式を検討する。
