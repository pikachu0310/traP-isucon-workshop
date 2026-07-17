# 最後の10分で、速い構成を「提出できる構成」にする

大きな変更を重ねたあとは、動いている今だけを見ると危険です。競技終了時に再起動されても戻ること、初期化で3台が同じ開始状態になること、Gitに再現手順があることまで確認します。

## 3台それぞれの再起動後チェック

人間が見る項目は、意外と素朴です。

- nginxが`active`
- MariaDBが`active`
- Goアプリが`active`
- coordinatorからworkerのportへ到達できる
- workerのpprofは外部公開されず、`127.0.0.1`だけで待つ
- 3つのFQDNでTLS接続できる
- coordinatorの環境変数に2台のprivate IPが残っている
- worker A/Bのshard番号が重複していない

systemdは、Linuxでアプリを起動・監視する仕組みです。手作業で起動したprocessは、再起動すると消えます。変更したbinaryだけでなく、unit fileと環境変数もGitからdeployできる状態にします。

## 初期化の順番

`POST /initialize`はcoordinatorが受け、2台のworkerにも初期化を依頼します。3台すべてがmemoryを作り終えてから200を返します。

初期化中に次のベンチrequestが来ると、古いmemoryと新しいmemoryが混ざります。そのため、初期化を一つの区切りとして扱い、失敗したworkerが1台でもあれば成功を返しません。

## 正しさの確認

最後のベンチでは、score以外に次を確認します。

| 確認        | 合格条件            |
| ----------- | ------------------- |
| benchmark   | `pass`              |
| deduction   | 0                   |
| HTTP 5xx    | 0件                 |
| workerの401 | 0件                 |
| nginx error | 新しい重大errorなし |
| service     | 3台すべてactive     |
| initialize  | timeoutせず成功     |

timeoutは0が理想ですが、ベンチは一定数を許します。件数だけでなく、利用者増加が止まった時刻と同時に増えていないかを見ます。

## Gitに入れるもの、入れないもの

今回Git管理したもの:

- Go実装とtest
- 初期化SQL
- coordinator・workerの環境変数
- Nginx、MariaDB、systemd設定
- deploy・benchmark script
- score履歴と、判断に使った小さな要約
- 講習で見せるpprof画像

入れなかったもの:

- 数十MBのaccess log
- 生のpprof profile
- benchmarkの全出力
- build済みbinary
- 秘密鍵やAWS credential

生ログを全部捨てるわけではありません。手元には残し、Gitにはroute集計、pprof上位、vmstat要約、失敗を判断した数行だけを置きます。

## 最終確認プロンプト

```text
改善を止め、提出前の再現性と正しさを確認してください。

- Git差分から、必要な設定・source・scriptが揃っているか確認する
- credential、秘密鍵、巨大ログ、binaryがGit対象でないことを確認する
- 3台を順にrebootする
- 各台でnginx、MariaDB、Goアプリが自動復帰したことを確認する
- coordinatorからworkerのinternal portへ到達できることを確認する
- POST /initializeを実行し、3台のmemoryが作り直されたことを確認する
- 最終benchmarkを1回実行する
- pass、deduction、timeout、HTTP status、nginx errorを確認する
- go test、go vet、nginx -t、shell scriptのsyntax checkを行う
- deploy手順をREADMEだけから再現できるか読み直す
- 最終scoreと測定条件を履歴へ記録する

新しい高速化は入れず、失敗したら原因を直して同じ確認を最初から行ってください。
```

## Agentと走った応用編を振り返る

初期`1,284`点から始まり、1台の同居ベンチで`57,208`点、3台をrebootしたあとのAWS内測定で`74,550`点まで来ました。外部では`98,004`点も出ました。

けれど、一番大切な成果は数字だけではありません。

- slow query logから、1億行の走査を見つけた
- access logから、静的配信と転送量を減らした
- pprofから、ログ、JSON、GC、syscallへ山が移る様子を追った
- memory化という大変更を、仕様とtestで守った
- 3台化の0点から、分散では同期が主役だと学んだ
- 回線断の0点を、途中8.8万点だからと成功扱いしなかった

AI Agentは、数時間で人間がためらう量のコードを書き換えました。同時に、計測していなければ、過大なmemory確保も同期漏れも見逃したでしょう。

Agentが強くなったから、計測が要らなくなったのではありません。Agentが強くなったからこそ、**計測を根拠に大きく動けるようになった**。今年の実習で、そこを一緒に楽しめたらうれしいです。
