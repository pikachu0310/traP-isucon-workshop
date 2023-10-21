# アクセスログを導入して、計測する

アクセスログを解析することで、どのリクエストがボトルネックなのかが分かります。
## nginx について
nginxはWebサーバーアプリケーションで、リバースプロキシやロードバランサ、HTTPキャッシュなどの様々な機能を持っています。  
ISUCONでは、サーバーに来たリクエストをメインのアプリケーションに転送するリバースプロキシとして初期状態から稼働していることが多いです。

現在の状態では、`:80`に来たリクエストを`:8000`で稼働している`isucari.golang.service`に転送する設定がされています。

## nginx のアクセスログについて
nginx は、アクセスログを出力します。  
アクセスログとは、サーバーに来たリクエストの情報を記録したログのことです。  
アクセスログを解析することで、どのようなリクエストが来ているか、どのリクエストがどのくらいの時間がかかっているかなどが分かります。   

## アクセスログ解析ツールの導入
今回は`alp`というアクセスログ解析ツールを使います。  
URI ごとの処理時間の合計や平均、何回リクエストが来たかなどを見やすく集計してくれます。  
以下のコマンドを実行して、`alp`をインストールします。
```shell
mkdir ~/tools
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
isucon@ip-172-31-36-11:~/log$ sudo cat /var/log/nginx/access.log | alp ltsv
+-------+-----+-----+-----+-----+-----+--------+----------------------------------------------+-------+-------+---------+-------+-------+-------+-------+--------+------------+------------+-------------+------------+
| COUNT | 1XX | 2XX | 3XX | 4XX | 5XX | METHOD |                     URI                      |  MIN  |  MAX  |   SUM   |  AVG  |  P90  |  P95  |  P99  | STDDEV | MIN(BODY)  | MAX(BODY)  |  SUM(BODY)  | AVG(BODY)  |
+-------+-----+-----+-----+-----+-----+--------+----------------------------------------------+-------+-------+---------+-------+-------+-------+-------+--------+------------+------------+-------------+------------+
| 1     | 0   | 1   | 0   | 0   | 0   | GET    | /items/49410.json                            | 0.004 | 0.004 | 0.004   | 0.004 | 0.004 | 0.004 | 0.004 | 0.000  | 2239.000   | 2239.000   | 2239.000    | 2239.000   |
| 1     | 0   | 1   | 0   | 0   | 0   | GET    | /items/46582.json                            | 0.008 | 0.008 | 0.008   | 0.008 | 0.008 | 0.008 | 0.008 | 0.000  | 2130.000   | 2130.000   | 2130.000    | 2130.000   |
| 1     | 0   | 1   | 0   | 0   | 0   | GET    | /static/js/runtime~main.a8a9905a.js          | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 1502.000   | 1502.000   | 1502.000    | 1502.000   |
| 1     | 0   | 1   | 0   | 0   | 0   | GET    | /static/js/main.babc3d4d.chunk.js            | 0.004 | 0.004 | 0.004   | 0.004 | 0.004 | 0.004 | 0.004 | 0.000  | 90365.000  | 90365.000  | 90365.000   | 90365.000  |
| 1     | 0   | 1   | 0   | 0   | 0   | GET    | /static/css/main.19393e92.chunk.css          | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 994.000    | 994.000    | 994.000     | 994.000    |
| 1     | 0   | 0   | 0   | 1   | 0   | POST   | /                                            | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 19.000     | 19.000     | 19.000      | 19.000     |
| 1     | 0   | 0   | 0   | 1   | 0   | GET    | /.env                                        | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 19.000     | 19.000     | 19.000      | 19.000     |
| 1     | 0   | 1   | 0   | 0   | 0   | GET    | /reports.json                                | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 101183.000 | 101183.000 | 101183.000  | 101183.000 |
| 1     | 0   | 1   | 0   | 0   | 0   | GET    | /items/49551.json                            | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 1955.000   | 1955.000   | 1955.000    | 1955.000   |
| 1     | 0   | 1   | 0   | 0   | 0   | GET    | /items/48790.json                            | 0.004 | 0.004 | 0.004   | 0.004 | 0.004 | 0.004 | 0.004 | 0.000  | 1930.000   | 1930.000   | 1930.000    | 1930.000   |
```
:::
`/items/49410.json`や、`/items/46582.json`など、同じような URI が多数あります。  
これらは、同じ handler で処理されるので一つの URI として集計したほうが良いので、コマンドに正規表現でまとめるオプションを付けます。
```shell
sudo cat /var/log/nginx/access.log | alp ltsv -m"/users/\d+.json","/items/\d+.json","/new_items/\d+.json","/upload/.+.jpg","/transactions/\d+.png"
```
いい感じに集計できてますね。最後に、今回1番重要な情報である`SUM`(合計処理時間)で降順にソートします。`--sort sum -r`を最後に着けます。
```shell
sudo cat /var/log/nginx/access.log | alp ltsv -m "/users/\d+.json","/items/\d+.json","/new_items/\d+.json","/upload/.+.jpg","/transactions/\d+.png" --sort sum -r
```
:::details 出力結果
```
isucon@ip-172-31-36-11:~/log$ sudo cat /var/log/nginx/access.log | alp ltsv -m "/users/\d+.json","/items/\d+.json","/new_items/\d+.json","/upload/.+.jpg","/transactions/\d+.png" --sort sum -r
+-------+-----+------+-----+-----+-----+--------+-------------------------------------+-------+-------+---------+-------+-------+-------+-------+--------+------------+------------+--------------+------------+
| COUNT | 1XX | 2XX  | 3XX | 4XX | 5XX | METHOD |                 URI                 |  MIN  |  MAX  |   SUM   |  AVG  |  P90  |  P95  |  P99  | STDDEV | MIN(BODY)  | MAX(BODY)  |  SUM(BODY)   | AVG(BODY)  |
+-------+-----+------+-----+-----+-----+--------+-------------------------------------+-------+-------+---------+-------+-------+-------+-------+--------+------------+------------+--------------+------------+
| 171   | 0   | 160  | 0   | 11  | 0   | GET    | /users/transactions.json            | 0.052 | 6.540 | 480.397 | 2.809 | 4.904 | 5.672 | 6.524 | 1.623  | 0.000      | 29174.000  | 3278536.000  | 19172.725  |
| 785   | 0   | 784  | 0   | 1   | 0   | GET    | /new_items/\d+.json                 | 0.036 | 1.484 | 149.168 | 0.190 | 0.416 | 0.488 | 0.704 | 0.163  | 0.000      | 24051.000  | 18431412.000 | 23479.506  |
| 267   | 0   | 267  | 0   | 0   | 0   | GET    | /users/\d+.json                     | 0.036 | 1.056 | 54.411  | 0.204 | 0.420 | 0.500 | 0.644 | 0.148  | 98.000     | 23980.000  | 3698269.000  | 13851.195  |
| 53    | 0   | 27   | 0   | 26  | 0   | POST   | /buy                                | 1.078 | 2.160 | 49.756  | 0.939 | 1.628 | 1.636 | 2.160 | 0.797  | 0.000      | 49.000     | 1860.000     | 35.094     |
| 100   | 0   | 100  | 0   | 0   | 0   | GET    | /new_items.json                     | 0.104 | 1.180 | 38.990  | 0.390 | 0.716 | 0.784 | 0.924 | 0.228  | 23062.000  | 23784.000  | 2340560.000  | 23405.600  |
| 41    | 0   | 23   | 0   | 18  | 0   | POST   | /ship_done                          | 0.808 | 1.160 | 20.719  | 0.505 | 0.820 | 0.824 | 1.160 | 0.404  | 29.000     | 83.000     | 1676.000     | 40.878     |
| 38    | 0   | 26   | 0   | 12  | 0   | POST   | /ship                               | 0.816 | 1.248 | 19.520  | 0.514 | 0.820 | 1.116 | 1.248 | 0.419  | 29.000     | 61.000     | 1982.000     | 52.158     |
| 61    | 0   | 53   | 0   | 8   | 0   | POST   | /login                              | 0.092 | 0.504 | 14.924  | 0.245 | 0.400 | 0.480 | 0.504 | 0.122  | 73.000     | 103.000    | 5783.000     | 94.803     |
| 21    | 0   | 21   | 0   | 0   | 0   | POST   | /complete                           | 0.004 | 0.824 | 14.638  | 0.697 | 0.812 | 0.824 | 0.824 | 0.280  | 34.000     | 34.000     | 714.000      | 34.000     |
| 2356  | 0   | 2356 | 0   | 0   | 0   | GET    | /items/\d+.json                     | 0.004 | 0.140 | 14.164  | 0.006 | 0.012 | 0.016 | 0.028 | 0.007  | 1860.000   | 3966.000   | 5192391.000  | 2203.901   |
| 1     | 0   | 1    | 0   | 0   | 0   | POST   | /initialize                         | 7.439 | 7.439 | 7.439   | 7.439 | 7.439 | 7.439 | 7.439 | 0.000  | 31.000     | 31.000     | 31.000       | 31.000     |
| 53    | 0   | 53   | 0   | 0   | 0   | GET    | /settings                           | 0.004 | 0.276 | 3.536   | 0.067 | 0.204 | 0.240 | 0.276 | 0.081  | 2940.000   | 2953.000   | 156249.000   | 2948.094   |
| 51    | 0   | 33   | 0   | 18  | 0   | POST   | /sell                               | 0.012 | 0.392 | 2.216   | 0.043 | 0.116 | 0.372 | 0.392 | 0.093  | 13.000     | 106.000    | 1875.000     | 36.765     |
| 35    | 0   | 23   | 0   | 12  | 0   | GET    | /transactions/\d+.png               | 0.004 | 0.540 | 1.204   | 0.034 | 0.016 | 0.540 | 0.540 | 0.125  | 33.000     | 628.000    | 14533.000    | 415.229    |
| 13    | 0   | 13   | 0   | 0   | 0   | POST   | /bump                               | 0.004 | 0.256 | 0.424   | 0.033 | 0.048 | 0.256 | 0.256 | 0.065  | 89.000     | 92.000     | 1178.000     | 90.615     |
| 9     | 0   | 3    | 0   | 6   | 0   | POST   | /items/edit                         | 0.004 | 0.040 | 0.076   | 0.008 | 0.040 | 0.040 | 0.040 | 0.012  | 58.000     | 93.000     | 625.000      | 69.444     |
| 57    | 0   | 57   | 0   | 0   | 0   | GET    | /upload/.+.jpg                      | 0.000 | 0.004 | 0.056   | 0.001 | 0.004 | 0.004 | 0.004 | 0.002  | 53280.000  | 134363.000 | 4360184.000  | 76494.456  |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /static/js/main.babc3d4d.chunk.js   | 0.004 | 0.004 | 0.004   | 0.004 | 0.004 | 0.004 | 0.004 | 0.000  | 90365.000  | 90365.000  | 90365.000    | 90365.000  |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /static/css/main.19393e92.chunk.css | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 994.000    | 994.000    | 994.000      | 994.000    |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /static/js/runtime~main.a8a9905a.js | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 1502.000   | 1502.000   | 1502.000     | 1502.000   |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /static/js/2.ff6e1067.chunk.js      | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 508459.000 | 508459.000 | 508459.000   | 508459.000 |
| 1     | 0   | 1    | 0   | 0   | 0   | GET    | /reports.json                       | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 101183.000 | 101183.000 | 101183.000   | 101183.000 |
| 1     | 0   | 0    | 0   | 1   | 0   | GET    | /.env                               | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 19.000     | 19.000     | 19.000       | 19.000     |
| 1     | 0   | 0    | 0   | 1   | 0   | POST   | /                                   | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 19.000     | 19.000     | 19.000       | 19.000     |
+-------+-----+------+-----+-----+-----+--------+-------------------------------------+-------+-------+---------+-------+-------+-------+-------+--------+------------+------------+--------------+------------+
```
:::
参考: [alpの使い方(基本編)](https://zenn.dev/tkuchiki/articles/how-to-use-alp)
:::tip 結局どこ見ればよいの？
1番重要な情報は`SUM`(合計処理時間)です。なので`SUM`でソートしていて、上位にあるリクエストがボトルネックです。  
`COUNT`も重要で、`COUNT`はリクエストが来た回数です。多ければそのリクエストが多く来ていることを表しています。
:::
## アクセスログの解析結果からボトルネックを特定する
解析結果の`SUM`の部分を見てみると、`/users/transactions.json`が`480.397`と、ダントツで処理に時間がかかっていることが分かりました。これがボトルネックです！  
なので、まずは`/users/transactions.json`の部分を改善しよう！となります。次の方針が定まりました。  

## ログローテーション
nginx は、アクセスログを`/var/log/nginx/access.log`に出力します。スロークエリログと同じく、こちらもログローテーションを行う必要があります。  
ベンチマークを実行する前に以下のコマンドを実行するようにしましょう。
```shell
mkdir ~/isucari/log
sudo cat /var/log/nginx/access.log | alp ltsv -m "/users/\d+.json","/items/\d+.json","/new_items/\d+.json","/upload/.+.jpg","/transactions/\d+.png" --sort sum -r > ~/isucari/log/$(date +access.log-%m-%d-%H-%M -d "+9 hours")
sudo rm /var/log/nginx/access.log
```

## ローカルで`/users/transactions.json`の部分を見てみる
`webapp/go/main.go`をローカルのエディタで開いてください。  
`/users/transactions.json`で検索すると、328行目にハンドラーの部分で見つかります。
```go
    mux.HandleFunc(pat.Get("/users/transactions.json"), getTransactions)
```
どうやら`getTransactions`という関数が激遅のようですね。
:::details getTransactionsの中身
```go
func getTransactions(w http.ResponseWriter, r *http.Request) {

	user, errCode, errMsg := getUser(r)
	if errMsg != "" {
		outputErrorMsg(w, errCode, errMsg)
		return
	}

	query := r.URL.Query()
	itemIDStr := query.Get("item_id")
	var err error
	var itemID int64
	if itemIDStr != "" {
		itemID, err = strconv.ParseInt(itemIDStr, 10, 64)
		if err != nil || itemID <= 0 {
			outputErrorMsg(w, http.StatusBadRequest, "item_id param error")
			return
		}
	}

	createdAtStr := query.Get("created_at")
	var createdAt int64
	if createdAtStr != "" {
		createdAt, err = strconv.ParseInt(createdAtStr, 10, 64)
		if err != nil || createdAt <= 0 {
			outputErrorMsg(w, http.StatusBadRequest, "created_at param error")
			return
		}
	}

	tx := dbx.MustBegin()
	items := []Item{}
	if itemID > 0 && createdAt > 0 {
		// paging
		err := tx.Select(&items,
			"SELECT * FROM `items` WHERE (`seller_id` = ? OR `buyer_id` = ?) AND `status` IN (?,?,?,?,?) AND (`created_at` < ?  OR (`created_at` <= ? AND `id` < ?)) ORDER BY `created_at` DESC, `id` DESC LIMIT ?",
			user.ID,
			user.ID,
			ItemStatusOnSale,
			ItemStatusTrading,
			ItemStatusSoldOut,
			ItemStatusCancel,
			ItemStatusStop,
			time.Unix(createdAt, 0),
			time.Unix(createdAt, 0),
			itemID,
			TransactionsPerPage+1,
		)
		if err != nil {
			log.Print(err)
			outputErrorMsg(w, http.StatusInternalServerError, "db error")
			tx.Rollback()
			return
		}
	} else {
		// 1st page
		err := tx.Select(&items,
			"SELECT * FROM `items` WHERE (`seller_id` = ? OR `buyer_id` = ?) AND `status` IN (?,?,?,?,?) ORDER BY `created_at` DESC, `id` DESC LIMIT ?",
			user.ID,
			user.ID,
			ItemStatusOnSale,
			ItemStatusTrading,
			ItemStatusSoldOut,
			ItemStatusCancel,
			ItemStatusStop,
			TransactionsPerPage+1,
		)
		if err != nil {
			log.Print(err)
			outputErrorMsg(w, http.StatusInternalServerError, "db error")
			tx.Rollback()
			return
		}
	}

	itemDetails := []ItemDetail{}
	for _, item := range items {
		seller, err := getUserSimpleByID(tx, item.SellerID)
		if err != nil {
			outputErrorMsg(w, http.StatusNotFound, "seller not found")
			tx.Rollback()
			return
		}
		category, err := getCategoryByID(tx, item.CategoryID)
		if err != nil {
			outputErrorMsg(w, http.StatusNotFound, "category not found")
			tx.Rollback()
			return
		}

		itemDetail := ItemDetail{
			ID:       item.ID,
			SellerID: item.SellerID,
			Seller:   &seller,
			// BuyerID
			// Buyer
			Status:      item.Status,
			Name:        item.Name,
			Price:       item.Price,
			Description: item.Description,
			ImageURL:    getImageURL(item.ImageName),
			CategoryID:  item.CategoryID,
			// TransactionEvidenceID
			// TransactionEvidenceStatus
			// ShippingStatus
			Category:  &category,
			CreatedAt: item.CreatedAt.Unix(),
		}

		if item.BuyerID != 0 {
			buyer, err := getUserSimpleByID(tx, item.BuyerID)
			if err != nil {
				outputErrorMsg(w, http.StatusNotFound, "buyer not found")
				tx.Rollback()
				return
			}
			itemDetail.BuyerID = item.BuyerID
			itemDetail.Buyer = &buyer
		}

		transactionEvidence := TransactionEvidence{}
		err = tx.Get(&transactionEvidence, "SELECT * FROM `transaction_evidences` WHERE `item_id` = ?", item.ID)
		if err != nil && err != sql.ErrNoRows {
			// It's able to ignore ErrNoRows
			log.Print(err)
			outputErrorMsg(w, http.StatusInternalServerError, "db error")
			tx.Rollback()
			return
		}

		if transactionEvidence.ID > 0 {
			shipping := Shipping{}
			err = tx.Get(&shipping, "SELECT * FROM `shippings` WHERE `transaction_evidence_id` = ?", transactionEvidence.ID)
			if err == sql.ErrNoRows {
				outputErrorMsg(w, http.StatusNotFound, "shipping not found")
				tx.Rollback()
				return
			}
			if err != nil {
				log.Print(err)
				outputErrorMsg(w, http.StatusInternalServerError, "db error")
				tx.Rollback()
				return
			}
			ssr, err := APIShipmentStatus(getShipmentServiceURL(), &APIShipmentStatusReq{
				ReserveID: shipping.ReserveID,
			})
			if err != nil {
				log.Print(err)
				outputErrorMsg(w, http.StatusInternalServerError, "failed to request to shipment service")
				tx.Rollback()
				return
			}

			itemDetail.TransactionEvidenceID = transactionEvidence.ID
			itemDetail.TransactionEvidenceStatus = transactionEvidence.Status
			itemDetail.ShippingStatus = ssr.Status
		}

		itemDetails = append(itemDetails, itemDetail)
	}
	tx.Commit()

	hasNext := false
	if len(itemDetails) > TransactionsPerPage {
		hasNext = true
		itemDetails = itemDetails[0:TransactionsPerPage]
	}

	rts := resTransactions{
		Items:   itemDetails,
		HasNext: hasNext,
	}

	w.Header().Set("Content-Type", "application/json;charset=utf-8")
	json.NewEncoder(w).Encode(rts)

}
```
:::
長くてどこが遅いか分かんね～！という方は、次に紹介する計測ツール、`pprof`を使ってみましょう。  
こんな感じで、`alp`を用いて`getTransactions`という関数が遅いぞという所まで分かりました。
