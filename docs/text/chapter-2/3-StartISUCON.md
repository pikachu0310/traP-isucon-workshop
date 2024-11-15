# ベンチマーカーを動して、計測しよう

## ベンチマーカーが動くように、設定をする。
[PISCONマニュアルページ](https://piscon.trap.jp/manual)によると、サーバー内の`/etc/nginx/sites-available/isucondition.conf`ファイルを書き換える必要があります。  
ファイル編集コマンド`nano`や`vim`を使っても良いのですが、あまりここで躓いて欲しくないので、以下のコマンドを用意しました。サーバーに入って、以下のコマンドを実行してください。
```shell
sudo bash -c 'cat <<EOL > /etc/nginx/sites-available/isucondition.conf
server {
    # listen 443 ssl http2;

    # ssl_certificate /etc/nginx/certificates/tls-cert.pem;
    # ssl_certificate_key /etc/nginx/certificates/tls-key.pem;

    location / {
        proxy_set_header Host \$http_host;
        proxy_pass http://127.0.0.1:3000;
    }
}
EOL
'
```
上記のコマンドで設定ファイルを書き換えたら、nginxを再起動して設定を反映させます。
```shell
sudo nginx -t # 先ほど変更したファイルが、正しく読み込めるかチェック
sudo systemctl reload nginx # Nginxの設定を再読み込み
```

また、今回はもう1つ変更しなければならないファイルがあるため、以下のコマンドもサーバー内で実行してください。
```shell
sudo bash -c 'cat <<EOL > /home/isucon/env.sh 
MYSQL_HOST="127.0.0.1"
MYSQL_PORT=3306
MYSQL_USER=isucon
MYSQL_DBNAME=isucondition
MYSQL_PASS=isucon
POST_ISUCONDITION_TARGET_BASE_URL="http://isucondition-1.t.isucon.dev"
EOL
'
```

上記のコマンドで環境変数を書き換えたら、以下のコマンドでアプリを再起動して反映させます。
```shell
sudo systemctl restart isucondition.go.service # アプリ(isucondition)の再起動
```

これで、ベンチマークが正常に実行できます。

## 初めての計測
改めて、再度ベンチマークを回しましょう！  
ベンチマークを回してる間に、サーバー上で`htop`と入力し実行しましょう。  
`htop`とは、`Ubuntu`にデフォルトで入っている`process viewer`のことです。  
![](3-img/img.png)
左上に書いてあるのが、CPU使用率です。このサーバーは2コアで、どちらもフルに動いていますね。  
ベンチマークが走っている証です。  
CPUの所をクリックすると、CPU使用率の高い順にプロセスがソートされます。  
画像では、1番上のmysqlプロセスが145%ものCPUを使っていますね。2番目がアプリケーションで50%です。  
明らかにデーターベースがボトルネックとなっていそうだと分かります。  
`htop`は、`exit`コマンドで抜けれます。

## 初めてのスコア
ベンチマークが終わると、スコアが出てきます。
```json
12:39:46.447708 ===> PREPARE
12:39:52.237437 ===> LOAD
12:39:52.237656 score: 0(0 - 0) : Score
12:39:52.237661 deduction: 0 / timeout: 0
12:39:55.237683 score: 1140(1140 - 0) : pass
12:39:55.237697 deduction: 0 / timeout: 5
12:39:57.238413 ユーザーは増えませんでした
12:39:58.237915 score: 1353(1354 - 1) : pass
12:39:58.237932 deduction: 0 / timeout: 13
12:40:01.238034 score: 1439(1440 - 1) : pass
12:40:01.238051 deduction: 0 / timeout: 14
12:40:02.238543 ユーザーは増えませんでした
12:40:04.242102 score: 1534(1536 - 2) : pass
12:40:04.242127 deduction: 0 / timeout: 21
12:40:07.238797 ユーザーは増えませんでした
12:40:07.238958 score: 1670(1672 - 2) : pass
12:40:07.238968 deduction: 0 / timeout: 22
12:40:10.239247 score: 1776(1778 - 2) : pass
12:40:10.239267 deduction: 0 / timeout: 26
12:40:12.239656 ユーザーは増えませんでした
12:40:13.239588 score: 1902(1904 - 2) : pass
12:40:13.239605 deduction: 0 / timeout: 29
12:40:16.240152 score: 1929(1932 - 3) : pass
12:40:16.240169 deduction: 0 / timeout: 33
12:40:17.241025 ユーザーは増えませんでした
12:40:19.240608 score: 2033(2036 - 3) : pass
12:40:19.240625 deduction: 0 / timeout: 38
12:40:22.241471 score: 2031(2036 - 5) : pass
12:40:22.241624 deduction: 0 / timeout: 51
12:40:22.241769 ユーザーは増えませんでした
12:40:25.241566 score: 2034(2040 - 6) : pass
12:40:25.241593 deduction: 0 / timeout: 68
12:40:27.242968 タイムアウト数が多いため、サービスの評判が悪くなりました。以降ユーザーは増加しません
12:40:28.242855 score: 2031(2040 - 9) : pass
12:40:28.242873 deduction: 0 / timeout: 90
12:40:31.243302 score: 2030(2040 - 10) : pass
12:40:31.243319 deduction: 0 / timeout: 108
12:40:34.243328 score: 2027(2040 - 13) : pass
12:40:34.243345 deduction: 0 / timeout: 132
12:40:37.245497 score: 2025(2040 - 15) : pass
12:40:37.245513 deduction: 0 / timeout: 153
12:40:40.244330 score: 2023(2040 - 17) : pass
12:40:40.244347 deduction: 0 / timeout: 175
12:40:43.245072 score: 2021(2040 - 19) : pass
12:40:43.245091 deduction: 0 / timeout: 196
12:40:46.246956 score: 2019(2040 - 21) : pass
12:40:46.246973 deduction: 0 / timeout: 219
12:40:49.247363 score: 2016(2040 - 24) : pass
12:40:49.247385 deduction: 0 / timeout: 244
12:40:52.244342 SCORE: 00.StartBenchmark : 1
12:40:52.244361 SCORE: 01.GraphGood : 0
12:40:52.244364 SCORE: 02.GraphNormal : 0
12:40:52.244366 SCORE: 03.GraphBad : 0
12:40:52.244368 SCORE: 04.GraphWorst : 32
12:40:52.244370 SCORE: 05.TodayGraphGood : 0
12:40:52.244372 SCORE: 06.TodayGraphNormal : 0
12:40:52.244375 SCORE: 07.TodayGraphBad : 0
12:40:52.244377 SCORE: 08.TodayGraphWorst : 23
12:40:52.244404 SCORE: 09.ReadInfoCondition : 17
12:40:52.244407 SCORE: 10.ReadWarningCondition : 36
12:40:52.244409 SCORE: 11.ReadCriticalCondition: 16
12:40:52.248587 score: 2078(2104 - 26) : pass
12:40:52.248602 deduction: 0 / timeout: 266
```
初期状態でのスコアは2078点でした！ようやくISUCONが始まりましたね！
