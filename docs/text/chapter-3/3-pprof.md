# pprof (fgprof)

## pprofとは

[pprof](https://pkg.go.dev/net/http/pprof) は、Go言語用の計測データ解析・視覚化ツールです。
アプリケーションのどの行でどれくらい処理に時間が掛かっているかを計測・可視化できます。

## 導入方法

計測の準備をします。

### ソースコードの変更

バージョン管理のため、`git clone` で手元に持ってきたソースコードを書き換えて導入します。

計測対象のソースコード `main.go` の先頭に、`import _ "net/http/pprof"` と書き加えます。

```go
package main

import _ "net/http/pprof" // [!code ++]
```

次に、`main.go` の `main()` 関数の先頭に、次の3行を書き加えます。

```go
func main() {
	go func() { // [!code ++]
		log.Println(http.ListenAndServe("localhost:6060", nil)) // [!code ++]
	}() // [!code ++]

	// 後略
}
```

`git clone` したディレクトリ内で以下のコマンドを実行し、コミットとpushを行います。
これでGitHub上に自分の変更が反映されます。

```shell
git add .
git commit -m "計測のためpprofの設定を追加"
git push
```

### サーバー上への反映

これだけでは、サーバー上で動いているアプリケーションには反映されていません。
実際にサーバー上で動いているアプリケーションにも、自分の変更を反映させましょう。

まず、サーバー上のGitリポジトリのルートで、`git pull` を行い、ソースコードの変更をサーバー上のファイルに反映させます。

```shell
cd ~/isucari
git pull
```

次に、アプリケーションのビルドを行います。

<!-- TODO: 正しいディレクトリとバイナリ名が分からないので書いて -->
```shell
cd ~/isucon/webapp/go
make isucari
```

最後に、アプリケーションを再起動して、変更を反映させましょう。

```shell
sudo systemctl restart isucari.golang.service
```

## アプリケーションの計測

### 計測の実行

pprofでアプリケーションを計測します。

計測を行うタイミングは、アプリケーションに負荷がかかっているときである方が、有益な情報が得られるでしょう。
そのため通常は、ベンチマーク中の一番負荷がかかるタイミングで計測を行います。

次のコマンドで30秒間計測を行います。
`htop` でCPU使用率を監視し、一番負荷がかかるタイミングを見極めて、計測を行いましょう。

```shell
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
```

計測が終わると、`Saved profile in /home/isucon/pprof/pprof.samples.cpu.001.pb.gz` のような出力が出ます。
このファイルに、今回の計測結果が記録されています。
ファイル名を覚えておきましょう。

### 計測結果の可視化

上の結果ファイルは、そのままでは人間が読めないので、ブラウザ上で可視化して見られるようにしましょう。

手元のブラウザで計測結果を見るため、まずはSSHの「Local Port Forward」を行います。
サーバーにSSHで接続する際、`-L 6070:localhost:6070` オプションを加えます。
成功すると、手元のブラウザで `localhost:6070` にアクセスすると、サーバー上の `localhost:6070` にアクセスが可能になります。

```shell
ssh -L 6070:localhost:6070 isucon9
```

可視化に必要なライブラリがあるため、次のコマンドでサーバー上にインストールします。
```shell
sudo apt update
sudo apt install graphviz
```

次のコマンドで、サーバー上の `localhost:6070` で可視化Webサーバーを立ち上げましょう。
`/home/isucon/pprof/pprof.isucari.samples.cpu.001.pb.gz` の部分を、可視化したい計測結果のファイル名に置き換えてください。

```shell
go tool pprof -http=localhost:6070 /home/isucon/pprof/pprof.isucari.samples.cpu.001.pb.gz
```

手元のブラウザで `http://localhost:6070` にアクセスして、「pprof」のページが表示されれば成功です。

:::tip 楽に計測・可視化するために

以上の手順を毎回やっていては、手間がかかりますね。
ISUCON本番では時間が足りなくなるので、毎回計測の際に叩くコマンドをシェルスクリプトやMakefile、Taskfileなどにまとめておくと良いでしょう。

pprof関連では、計測コマンドと、最後の計測結果ファイルの可視化をショートカットで叩けるようにすると良いでしょう。
以下は、[Makefileで最後の計測結果ファイルの可視化を行う例](https://github.com/oribe1115/traP-isucon-newbie-handson2022/blob/410826d2de077e33a851deea173f27b6bffb7e75/Makefile#L54)です。

```make
.PHONY: pprof-check
pprof-check:
	$(eval latest := $(shell ls -rt ~/pprof/ | tail -n 1))
	go tool pprof -http=localhost:6070 ~/pprof/$(latest)
```

:::

## 計測結果の解読

計測結果には、様々な表示が存在します。

ブラウザで計測結果を開くと、まず大きくグラフ（DAG）が表示されるはずです。
これは、どの関数でどれほど処理に時間が掛かり、さらにその関数内でどの関数の呼び出しに時間が掛かったかを可視化しています。

![](3-img/img.png)

また、左上の「View」から「Flame Graph」を選ぶと、Flame Graphと呼ばれる形式の表示になります。
表示方法が異なりますが、可視化している情報はトップのGraph表示と同じです。
見やすい方を使いましょう。

![](3-img/img-2.png)

## ボトルネックを発見する
以下にネタバレを含みます。

## (ネタバレ) 今回のケースは特別で、`getTransactions`のボトルネックはpprofでは計測できない
今回は、pprofを見ると、`alp`で1番ボトルネックだった`getTransactions`が、全然ボトルネックに見えません。  
これが今回のひっかけで、pprofはCPUの使用時間を記録しているのですが、実は`getTransactions`で起こっているのは、CPUを使わない「待機」だったのです。
ではどう計測すればよかったのかというと、`fgprof`というツールを使います。これはpprofとは違い、待機を含む実世界の時間全てを記録できます。  
[fgprof](https://github.com/felixge/fgprof)  
導入方法は以下の通りにしてください。  
https://github.com/pikachu0310/isucon-workshop-2023/compare/2710...2610  
扱い方は`pprof`とほとんど同じで、以下のようにして計測します。  
`go tool pprof http://localhost:6060/debug/fgprof/profile?seconds=60`
`go tool pprof -http=localhost:6070 /home/isucon/pprof/pprof.samples.cpu.001.pb.gz`  
fgprofのページを開いたら、左上から`VIEW`を選らび、`Flame Graph`を選びましょう。待機時間をカウントしてるので、関係ない奴が多数あります。ここでは、`http.(*conn).serve`をクリックしてください。  
![](4-img/img.png)
![](4-img/img-2.png)
`main.getTransactions`が2/3を占めています！`VIEW`から`Top`を選び、`main.getTransactions`をクリックし、`VIEW`から`Source`を選びましょう。  
http://localhost:6070/ui/source?f=main%5C.getTransactions このリンクからでも行けると思います。  
`getTransactions`のソースコードが表示され、各行でどのくらいの時間がかかっているかが表示されました。  
![](4-img/img-3.png)
一番時間がかかっている場所を探すと、993行目に`8.37mins`という、目を疑う単位が書いてあります。  
`ssr, err := APIShipmentStatus(...`の部分です。  
さらに`APIShipmentStatus`の中身を見てみましょう。  
http://localhost:6070/ui/source?f=main%5C.APIShipmentStatus  
`res, err := http.DefaultClient.Do(req)`という箇所がボトルネックだと発見できると思います。  
これで`getTransactions`が遅い原因がようやく特定できました！  
これは具体的には、ベンチマーカーに対してリクエストを送り、レスポンスが返ってくるまで待機するということが行われています。  
これこそがボトルネックだったのです。`getTransactions`が遅い理由の99.99%はココです。  
ようやくボトルネックが見つかったところで、これはどう改善すればよいのでしょうか？  
この改善は少し初心者には難しいですが、Goの並列処理`Gorutine`を用いて並列化するのが最も簡単な改善方法でしょう。実装例は以下の通りです。  
https://github.com/pikachu0310/piscon-2023-pikatokis/compare/a477f9b...9536b19  

これは初心者には大分難しいと思います。しかし、並列処理は確実に改善に繋がるので、ぜひ覚えておきましょう。
