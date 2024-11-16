# アクセスログ (alp)

アクセスログを解析することで、どのリクエストがボトルネックなのかが分かります。
## nginx について
nginxはWebサーバーアプリケーションで、リバースプロキシやロードバランサ、HTTPキャッシュなどの様々な機能を持っています。  
ISUCONでは、サーバーに来たリクエストをメインのアプリケーションに転送するリバースプロキシとして初期状態から稼働していることが多いです。

現在の状態では、`:80`に来たリクエストを`:8000`で稼働している`isucondition.go.service`に転送する設定がされています。 // TODO
## nginx のアクセスログについて
nginx は、アクセスログを出力します。  
アクセスログとは、サーバーに来たリクエストの情報を記録したログのことです。  
アクセスログを解析することで、どのようなリクエストが来ているか、どのリクエストがどのくらいの時間がかかっているかなどが分かります。   

## アクセスログ解析ツールの導入
今回は`alp`というアクセスログ解析ツールを使います。  
URI ごとの処理時間の合計や平均、何回リクエストが来たかなどを見やすく集計してくれます。  
以下のコマンドを実行して、`alp`をインストールします。
```shell
cd ~/tools
wget https://github.com/tkuchiki/alp/releases/download/v1.0.21/alp_linux_amd64.tar.gz
tar zxvf alp_linux_amd64.tar.gz
sudo install alp /usr/local/bin
```

## nginx のアクセスログの形式を変更する
nginx のアクセスログの形式を変更します。  
`/etc/nginx/nginx.conf`を開き、nginx の設定ファイルを書き換えます。   
`sudo nano /etc/nginx/nginx.conf`で、以下の様に23行目`access_log`の所を消し、`log_format`と`access_log`を追加しましょう。
```:line-numbers=20
    keepalive_timeout 120;
    client_max_body_size 10m;

    access_log /var/log/nginx/access.log;  // [!code --]

    # TLS configuration
    ssl_protocols TLSv1.2;
```
```:line-numbers=20
    keepalive_timeout 120;
    client_max_body_size 10m;
    
    log_format ltsv "time:$time_local"  // [!code ++]
                    "\thost:$remote_addr"  // [!code ++]
                    "\tforwardedfor:$http_x_forwarded_for"  // [!code ++]
                    "\treq:$request" // [!code ++]
                    "\tstatus:$status" // [!code ++]
                    "\tmethod:$request_method" // [!code ++]
                    "\turi:$request_uri" // [!code ++]
                    "\tsize:$body_bytes_sent" // [!code ++]
                    "\treferer:$http_referer" // [!code ++]
                    "\tua:$http_user_agent" // [!code ++]
                    "\treqtime:$request_time" // [!code ++]
                    "\tcache:$upstream_http_x_cache" // [!code ++]
                    "\truntime:$upstream_http_x_runtime" // [!code ++]
                    "\tapptime:$upstream_response_time" // [!code ++]
                    "\tvhost:$host"; // [!code ++]
    
    access_log /var/log/nginx/access.log ltsv; // [!code ++]
    
    # TLS configuration
    ssl_protocols TLSv1.2;
```
書き換えたら、以下のコマンドで文法チェックをして nginx を再起動し、設定を反映させましょう。
```shell
sudo nginx -t
sudo systemctl reload nginx
```
これで準備完了です！

## アクセスログを計測する
計測する前に、既にあるアクセスログを削除しておきましょう。  
```shell
sudo rm /var/log/nginx/access.log
```
ベンチマークを実行しましょう。終わったら、以下のコマンドでアクセスログを解析しましょう。
```shell
sudo cat /var/log/nginx/access.log | alp ltsv
```
:::details 出力結果(一部)
```
isucon@ip-192-168-0-11:/var/log/nginx$ sudo cat /var/log/nginx/access.log | alp ltsv
+-------+-----+------+-----+-----+-----+--------+-----------------------------------------------------+-------+-------+---------+-------+-------+-------+-------+--------+------------+------------+---------------+------------+
| COUNT | 1XX | 2XX  | 3XX | 4XX | 5XX | METHOD |                         URI                         |  MIN  |  MAX  |   SUM   |  AVG  |  P90  |  P95  |  P99  | STDDEV | MIN(BODY)  | MAX(BODY)  |   SUM(BODY)   | AVG(BODY)  |
+-------+-----+------+-----+-----+-----+--------+-----------------------------------------------------+-------+-------+---------+-------+-------+-------+-------+--------+------------+------------+---------------+------------+
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /api/isu/b82dcff4-8fae-4773-9956-22ab354adb7e       | 0.004 | 0.004 | 0.004   | 0.004 | 0.004 | 0.004 | 0.004 | 0.000  | 136.000    | 136.000    | 136.000       | 136.000    |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /isu/8469e6f6-0d29-4052-87cf-dd9bfde45014/graph     | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 528.000    | 528.000    | 528.000       | 528.000    |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /api/isu/328f8053-64ab-4336-b400-728d873982f2/icon  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 19971.000  | 19971.000  | 19971.000     | 19971.000  |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /api/isu/f715b5ff-dd87-41fa-8072-01a881455d1e/icon  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 14460.000  | 14460.000  | 14460.000     | 14460.000  |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /api/isu/967b9ac0-a228-4348-a258-f9de52422585/icon  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 20908.000  | 20908.000  | 20908.000     | 20908.000  |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /api/isu/d6c835fd-4126-4b59-a21d-f31b3dfadc7d/icon  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 23533.000  | 23533.000  | 23533.000     | 23533.000  |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /api/isu/e9011e73-9f5b-4b65-91b9-72418d1a7272/icon  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 27009.000  | 27009.000  | 27009.000     | 27009.000  |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /api/isu/400a9eb9-6c83-4f14-8ca0-aa14235dbc8e/icon  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 30695.000  | 30695.000  | 30695.000     | 30695.000  |
| 1     | 0   | 1    | 0   | 0   | 0   | POST   | /initialize                                         | 0.228 | 0.228 | 0.228   | 0.228 | 0.228 | 0.228 | 0.228 | 0.000  | 23.000     | 23.000     | 23.000        | 23.000     |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /isu/eb104b95-3532-4828-8550-89da717b9667           | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 528.000    | 528.000    | 528.000       | 528.000    |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /isu/cab99f63-bb3a-4648-b6df-376396f2c7ab/graph     | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 528.000    | 528.000    | 528.000       | 528.000    |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /api/isu/eb104b95-3532-4828-8550-89da717b9667       | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 138.000    | 138.000    | 138.000       | 138.000    |
```
:::
`/api/isu/b82dcff4-8fae-4773-9956-22ab354adb7e`や、`/api/isu/328f8053-64ab-4336-b400-728d873982f2/icon`など、同じような URI が多数あります。  
これらは、同じ handler で処理されるので一つの URI として集計したほうが良いので、コマンドに正規表現でまとめるオプションを付けます。
```shell
sudo cat /var/log/nginx/access.log | alp ltsv -m"/api/isu/[a-f0-9\-]+","/api/isu/[a-f0-9\-]+/icon","/api/condition/[a-f0-9\-]+","/isu/[a-f0-9\-]+","/isu/[a-f0-9\-]+/graph","/isu/[a-f0-9\-]+/condition","/assets.*"
```
いい感じに集計できてますね。最後に、今回1番重要な情報である`SUM`(合計処理時間)で降順にソートします。`--sort sum -r`を最後に着けます。
```shell
sudo cat /var/log/nginx/access.log | alp ltsv -m"/api/isu/[a-f0-9\-]+","/api/isu/[a-f0-9\-]+/icon","/api/condition/[a-f0-9\-]+","/isu/[a-f0-9\-]+","/isu/[a-f0-9\-]+/graph","/isu/[a-f0-9\-]+/condition","/assets.*" --sort sum -r
```
:::details 出力結果
```
isucon@ip-192-168-0-11:/var/log/nginx$ sudo cat /var/log/nginx/access.log | alp ltsv -m"/api/isu/[a-f0-9\-]+","/api/isu/[a-f0-9\-]+/icon","/api/condition/[a-f0-9\-]+","/isu/[a-f0-9\-]+","/isu/[a-f0-9\-]+/graph","/isu/[a-f0-9\-]+/condition","/assets.*" --sort sum -r
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+-----------+
| COUNT | 1XX |  2XX  | 3XX | 4XX | 5XX | METHOD |            URI             |  MIN  |  MAX  |   SUM   |  AVG  |  P90  |  P95  |  P99  | STDDEV | MIN(BODY) | MAX(BODY)  |   SUM(BODY)   | AVG(BODY) |
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+-----------+
| 74349 | 0   | 73643 | 0   | 706 | 0   | POST   | /api/condition/[a-f0-9\-]+ | 0.004 | 0.120 | 582.266 | 0.008 | 0.020 | 0.052 | 0.096 | 0.018  | 0.000     | 14.000     | 112.000       | 0.002     |
| 8958  | 0   | 8352  | 0   | 606 | 0   | GET    | /api/isu/[a-f0-9\-]+       | 0.004 | 0.408 | 309.550 | 0.035 | 0.068 | 0.088 | 0.152 | 0.031  | 0.000     | 135429.000 | 177012916.000 | 19760.317 |
| 3883  | 0   | 3492  | 0   | 391 | 0   | GET    | /api/condition/[a-f0-9\-]+ | 0.004 | 0.564 | 194.353 | 0.050 | 0.096 | 0.120 | 0.204 | 0.041  | 0.000     | 7322.000   | 19907612.000  | 5126.864  |
| 200   | 0   | 27    | 0   | 173 | 0   | GET    | /api/trend                 | 0.016 | 1.012 | 189.303 | 0.947 | 1.004 | 1.008 | 1.012 | 0.197  | 0.000     | 8218.000   | 172828.000    | 864.140   |
| 980   | 0   | 925   | 0   | 55  | 0   | GET    | /api/isu                   | 0.004 | 0.244 | 49.967  | 0.051 | 0.092 | 0.108 | 0.156 | 0.031  | 3.000     | 4675.000   | 2841666.000   | 2899.659  |
| 780   | 0   | 340   | 0   | 440 | 0   | POST   | /api/auth                  | 0.012 | 0.180 | 8.384   | 0.011 | 0.028 | 0.040 | 0.088 | 0.019  | 0.000     | 19.000     | 5060.000      | 6.487     |
| 1662  | 0   | 1187  | 475 | 0   | 0   | GET    | /assets.*                  | 0.004 | 0.028 | 3.796   | 0.002 | 0.008 | 0.008 | 0.012 | 0.003  | 0.000     | 743417.000 | 157667082.000 | 94865.874 |
| 55    | 0   | 51    | 0   | 4   | 0   | POST   | /api/isu                   | 0.004 | 0.128 | 3.612   | 0.066 | 0.092 | 0.108 | 0.128 | 0.023  | 15.000    | 151.000    | 7106.000      | 129.200   |
| 396   | 0   | 176   | 0   | 220 | 0   | GET    | /api/user/me               | 0.004 | 0.096 | 3.284   | 0.008 | 0.024 | 0.036 | 0.076 | 0.014  | 21.000    | 46.000     | 11835.000     | 29.886    |
| 224   | 0   | 167   | 0   | 57  | 0   | POST   | /api/signout               | 0.004 | 0.100 | 2.836   | 0.013 | 0.032 | 0.044 | 0.084 | 0.016  | 21.000    | 21.000     | 1197.000      | 5.344     |
| 436   | 0   | 374   | 62  | 0   | 0   | GET    | /                          | 0.000 | 0.020 | 0.776   | 0.002 | 0.004 | 0.008 | 0.012 | 0.003  | 528.000   | 528.000    | 197472.000    | 452.917   |
| 1     | 0   | 1     | 0   | 0   | 0   | POST   | /initialize                | 0.228 | 0.228 | 0.228   | 0.228 | 0.228 | 0.228 | 0.228 | 0.000  | 23.000    | 23.000     | 23.000        | 23.000    |
| 30    | 0   | 18    | 12  | 0   | 0   | GET    | /isu/[a-f0-9\-]+           | 0.000 | 0.004 | 0.016   | 0.001 | 0.004 | 0.004 | 0.004 | 0.001  | 0.000     | 528.000    | 9504.000      | 316.800   |
| 3     | 0   | 1     | 2   | 0   | 0   | GET    | /register                  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 0.000     | 528.000    | 528.000       | 176.000   |
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+-----------+
```
:::
参考: [alpの使い方(基本編)](https://zenn.dev/tkuchiki/articles/how-to-use-alp)
:::tip 結局どこ見ればよいの？
1番重要な情報は`SUM`(合計処理時間)です。なので`SUM`でソートしていて、上位にあるリクエストがボトルネックです。  
`COUNT`も重要で、`COUNT`はリクエストが来た回数です。多ければそのリクエストが多く来ていることを表しています。
:::
## アクセスログの解析結果からボトルネックを特定する
解析結果の`SUM`の部分を見てみると、`/api/condition/[a-f0-9\-]+`が`582.266`と、かなり処理に時間がかかっていることが分かりました。これがボトルネックです！  
なので、まずは`/api/condition/[a-f0-9\-]+`の部分を改善しよう！となります。次の方針が定まりました。  

## ログローテーション
nginx は、アクセスログを`/var/log/nginx/access.log`に出力します。スロークエリログと同じく、こちらもログローテーションを行う必要があります。  
ベンチマークを実行する前に以下のコマンドを実行するようにしましょう。
```shell
sudo cat /var/log/nginx/access.log | alp ltsv -m"/api/isu/[a-f0-9\-]+","/api/isu/[a-f0-9\-]+/icon","/api/condition/[a-f0-9\-]+","/isu/[a-f0-9\-]+","/isu/[a-f0-9\-]+/graph","/isu/[a-f0-9\-]+/condition","/assets.*" --sort sum -r > ~/log/$(date +access.log-%m-%d-%H-%M -d "+9 hours")
sudo rm /var/log/nginx/access.log
sudo systemctl restart nginx
```

なお、最新のログは以下のコマンドで見ます。  
```shell
cd ~/log && cat $(ls -t access.log-* | head -n 1)
```

## ローカルで`/api/condition/[a-f0-9\-]+`の部分を見てみる
`~/webapp/go/main.go`をローカルのエディタで開いてください。  
`/api/condition`で検索すると、1160行目に関数が見つかります。
```go
// POST /api/condition/:jia_isu_uuid
// ISUからのコンディションを受け取る
func postIsuCondition(c echo.Context) error {
// TODO: 一定割合リクエストを落としてしのぐようにしたが、本来は全量さばけるようにすべき
dropProbability := 0.9
(省略)
```
なんか凄いことが書かれていませんか！？9割のリクエストを無視しているようです。その上でここまで遅い..... 楽しくなってきましたね！  
:::details postIsuConditionの中身
```go
// POST /api/condition/:jia_isu_uuid
// ISUからのコンディションを受け取る
func postIsuCondition(c echo.Context) error {
	// TODO: 一定割合リクエストを落としてしのぐようにしたが、本来は全量さばけるようにすべき
	dropProbability := 0.9
	if rand.Float64() <= dropProbability {
		c.Logger().Warnf("drop post isu condition request")
		return c.NoContent(http.StatusAccepted)
	}

	jiaIsuUUID := c.Param("jia_isu_uuid")
	if jiaIsuUUID == "" {
		return c.String(http.StatusBadRequest, "missing: jia_isu_uuid")
	}

	req := []PostIsuConditionRequest{}
	err := c.Bind(&req)
	if err != nil {
		return c.String(http.StatusBadRequest, "bad request body")
	} else if len(req) == 0 {
		return c.String(http.StatusBadRequest, "bad request body")
	}

	tx, err := db.Beginx()
	if err != nil {
		c.Logger().Errorf("db error: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}
	defer tx.Rollback()

	var count int
	err = tx.Get(&count, "SELECT COUNT(*) FROM `isu` WHERE `jia_isu_uuid` = ?", jiaIsuUUID)
	if err != nil {
		c.Logger().Errorf("db error: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}
	if count == 0 {
		return c.String(http.StatusNotFound, "not found: isu")
	}

	for _, cond := range req {
		timestamp := time.Unix(cond.Timestamp, 0)

		if !isValidConditionFormat(cond.Condition) {
			return c.String(http.StatusBadRequest, "bad request body")
		}

		_, err = tx.Exec(
			"INSERT INTO `isu_condition`"+
				"	(`jia_isu_uuid`, `timestamp`, `is_sitting`, `condition`, `message`)"+
				"	VALUES (?, ?, ?, ?, ?)",
			jiaIsuUUID, timestamp, cond.IsSitting, cond.Condition, cond.Message)
		if err != nil {
			c.Logger().Errorf("db error: %v", err)
			return c.NoContent(http.StatusInternalServerError)
		}

	}

	err = tx.Commit()
	if err != nil {
		c.Logger().Errorf("db error: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	return c.NoContent(http.StatusAccepted)
}
```

:::
長くてどこが遅いか分かんね～！ってなりますよね。しかし、Goにはとんでもない神ツールがあります。次の章で紹介する計測ツール、`pprof`を使ってみましょう！   
こんな感じで、`alp`を用いて`postIsuCondition`という関数が遅いぞという所まで分かりました！
