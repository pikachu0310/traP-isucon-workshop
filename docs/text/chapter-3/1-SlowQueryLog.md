# スロークエリログ (pt-query-digest)
スロークエリログを解析することで、実行に時間がかかっているクエリを見つけ出します。

## スロークエリログの設定

MySQLには実行時間が長いSQLクエリを記録するスロークエリログ機能があり、これはボトルネックの特定に役立ちます。  
しかし、デフォルトではこの機能はOFFです。  スロークエリログをONにするには、MySQLの設定ファイル(`/etc/mysql/mysql.conf.d/mysqld.cnf`)を直接編集します。  
設定ファイルを表示するには、サーバー上で`cat /etc/mysql/mysql.conf.d/mysqld.cnf`を実行します。
```:line-numbers=75{2,3,4}
# Here you can see queries with especially long duration
#slow_query_log         = 1
#slow_query_log_file    = /var/log/mysql/mysql-slow.log
#long_query_time = 2
#log-queries-not-using-indexes
```
とても長いファイルですが、76, 77, 78 行目にスロークエリの設定があります。  
76, 77, 78 行目の先頭にある`#`を削除し、`long_query_time`を`0`に変更します。  
`sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf`で書き換えましょう。(`vim`でも大丈夫です。)
```:line-numbers=75{2,3,4}
# Here you can see queries with especially long duration
slow_query_log         = 1
slow_query_log_file    = /var/log/mysql/mysql-slow.log
long_query_time = 0
#log-queries-not-using-indexes
```
`slow_query_log`は、スロークエリログを有効にするかどうかの設定です。  
`slow_query_log_file`は、スロークエリログの出力先のファイル名です。  
`long_query_time`以上に実行に時間がかかったクエリが、スロークエリログとして出力されます。  
これを0にすることで、全てのクエリをスロークエリとして記録します。
:::tip 設定ファイルの探し方
MySQLの設定ファイルは、`/etc/mysql/my.cnf ~/.my.cnf /usr/etc/my.cnf`の順番に読み込まれます。  
スロークエリログで探せばよいのは、ファイル名が`mysqld.cnf`で、その中の`[mysqld]`というセクションです。  
基本的には`/etc/mysql/my.cnf`の中身を見て、探していくと良いでしょう。
:::

## スロークエリログの確認

では、スロークエリログが有効になったかを確かめましょう。  
まず、先ほどの設定ファイルを反映するために、以下のコマンドで`MySQL`を再起動します。 
```shell
sudo systemctl restart mysql
```
`MySQL`を再起動したら、以下のコマンドを実行して`MySQL`に入りましょう。
```shell
mysql -u isucari -pisucari
```
`MySQL`の中で`show variables like 'slow%';`を実行し、`MySQL`のスロークエリログの設定を確認します。
```
mysql> show variables like 'slow%';
+---------------------+-------------------------------+
| Variable_name       | Value                         |
+---------------------+-------------------------------+
| slow_launch_time    | 2                             |
| slow_query_log      | ON                            |
| slow_query_log_file | /var/log/mysql/mysql-slow.log |
+---------------------+-------------------------------+
3 rows in set (0.00 sec)
```
上の6行目を見ると、`slow_query_log`が`ON`になっています。  
これでスロークエリログが有効になりました！

## スロークエリを解析するツールを導入する

今回は`pt-query-digest`というツールを使います。  
以下のコマンドを実行して、`pt-query-digest`をインストールしましょう。
```shell
mkdir ~/tools
cd ~/tools
wget https://github.com/percona/percona-toolkit/archive/refs/tags/v3.5.5.tar.gz
tar zxvf v3.5.5.tar.gz
./percona-toolkit-3.5.5/bin/pt-query-digest --version
sudo install ./percona-toolkit-3.5.5/bin/pt-query-digest /usr/local/bin
pt-query-digest --version
```
最後の`pt-query-digest --version`でバージョンが表示されれば成功です！  
`pt-query-digest`は、スロークエリログを解析して、どのクエリが遅いのかをいい感じに表示して教えてくれるツールです。

## 実際に計測し、スロークエリログを解析する

まずは、再度ベンチマークを回してスロークエリログを取得しましょう。  
`{"pass":true,"score":2110,"campaign":0,"language":"Go","messages":[]}`
ログを取っている分少しだけスコアが下がりましたね。  
:::tip 計測はログを出力する分、パフォーマンスが落ちる
計測は非常に有用で必須ですが、ログを取る分余分に処理が走るので、パフォーマンスが落ち、スコアが少し下がります。  
なので、競技の終わりが近づいてきてガチで点数を狙いに行くときに、全てのログをオフにするなどをするのが一般的です。
:::
では、以下のコマンドを実行して、`pt-query-digest`でスロークエリログを解析してみましょう。
```shell
sudo pt-query-digest /var/log/mysql/mysql-slow.log
```
:::details 出力結果の一部
```
isucon@ip-172-31-36-11:~$ sudo pt-query-digest /var/log/mysql/mysql-slow.log
/var/log/mysql/mysql-slow.log:  82% 00:06 remain

# 59.1s user time, 520ms system time, 38.69M rss, 89.95M vsz
# Current date: Fri Oct 20 10:28:01 2023
# Hostname: ip-172-31-36-11
# Files: /var/log/mysql/mysql-slow.log
# Overall: 532.42k total, 65 unique, 4.36k QPS, 1.66x concurrency ________
# Time range: 2023-10-20T10:23:53 to 2023-10-20T10:25:55
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time           203s     1us   924ms   381us   467us     6ms    54us
# Lock time             8s       0    30ms    15us    20us   211us       0
# Rows sent        228.71k       0      49    0.44    0.99    2.19       0
# Rows examine      38.36M       0  48.91k   75.55    0.99   1.72k       0
# Query size       257.90M       0 913.29k  507.92   40.45  17.65k   31.70

# Profile
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0x5AF10ED6AD345D4B930FF1E60F9B9ED6  46.2205 22.8%    688 0.0672  0.05 SELECT items
#    2 0xDA556F9115773A1A99AA0165670CE848  26.9822 13.3% 176569 0.0002  0.01 ADMIN PREPARE
#    3 0xE1FCE50427E80F4FD12C53668328DB0D  24.9174 12.3% 115017 0.0002  0.00 SELECT categories
#    4 0x534F6185E0A0C71693761CC3349B416F  20.6844 10.2%    117 0.1768  0.04 SELECT items
#    5 0x6D959E4C28C709C1312243B842F41381  17.4278  8.6%    167 0.1044  0.05 SELECT items
#    6 0x396201721CD58410E070DA9421CA8C8D  13.5860  6.7%  52730 0.0003  0.01 SELECT users
#    7 0x528C15CEBCCFADFD36DB5799406088D9  12.6013  6.2%    116 0.1086  0.06 SELECT items
#    8 0x6688844580F541EC2C1B6BE83F13FC2B   8.5375  4.2%    107 0.0798  0.03 SELECT items
#    9 0x7769A9D5AB3A5E4B54AA9C3947003532   7.0707  3.5%    200 0.0354  0.02 INSERT items
#   10 0xC108F424549A524A9A74397A1FB13CDE   5.6208  2.8%     97 0.0579  0.04 SELECT items
#   11 0x61B4A126A90B2DEB4C0C6A2C3174E3A8   3.5276  1.7%     50 0.0706  0.02 SELECT items
#   12 0xBEB076BDFC84EB744C4F0D7D775BE587   2.8078  1.4%    196 0.0143  0.01 INSERT transaction_evidences
#   13 0x1C314789915EFB58DB9330FC1BC0B799   2.7587  1.4%   1717 0.0016  0.35 SELECT transaction_evidences
#   14 0xFFFCA4D67EA0A788813031B8BBC3B329   1.9130  0.9%    295 0.0065  0.56 COMMIT
# MISC 0xMISC                               8.4342  4.2% 184351 0.0000   0.0 <51 ITEMS>

# Query 1: 11.10 QPS, 0.75x concurrency, ID 0x5AF10ED6AD345D4B930FF1E60F9B9ED6 at byte 266611062
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.05
# Time range: 2023-10-20T10:24:52 to 2023-10-20T10:25:54
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0     688
# Exec time     22     46s     8ms   427ms    67ms   180ms    58ms    44ms
# Lock time      0    67ms    31us    17ms    98us   176us   684us    36us
# Rows sent     14  32.92k      49      49      49      49       0      49
# Rows examine  24   9.37M   3.84k  48.90k  13.95k  46.68k  15.13k   6.96k
# Query size     0 169.83k     248     257  252.77  246.02       0  246.02
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms  #
#  10ms  ################################################################
# 100ms  #################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'items'\G
#    SHOW CREATE TABLE `isucari`.`items`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `items` WHERE `status` IN ('on_sale','sold_out') AND category_id IN (21, 22, 23, 24) AND (`created_at` < '2019-08-12 15:27:55'  OR (`created_at` <= '2019-08-12 15:27:55' AND `id` < 48470)) ORDER BY `created_at` DESC, `id` DESC LIMIT 49\G

# Query 2: 2.76k QPS, 0.42x concurrency, ID 0xDA556F9115773A1A99AA0165670CE848 at byte 256925761
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.01
# Time range: 2023-10-20T10:24:51 to 2023-10-20T10:25:55
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         33  176569
# Exec time     13     27s    29us   288ms   152us   467us     1ms    54us
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Query size     1   5.05M      30      30      30      30       0      30
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  #########################
#   1ms  #
#  10ms  #
# 100ms  #
#    1s
#  10s+
administrator command: Prepare\G

# Query 3: 1.83k QPS, 0.40x concurrency, ID 0xE1FCE50427E80F4FD12C53668328DB0D at byte 266737012
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.00
# Time range: 2023-10-20T10:24:52 to 2023-10-20T10:25:55
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         21  115017
# Exec time     12     25s    44us    88ms   216us   657us   553us    80us
# Lock time     42      4s     8us    15ms    30us    57us   140us    16us
# Rows sent     49 112.32k       1       1       1       1       0       1
# Rows examine   0 112.32k       1       1       1       1       0       1
# Query size     1   4.60M      41      42   41.90   40.45    0.00   40.45
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  ###############################################
#   1ms  ##
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'categories'\G
#    SHOW CREATE TABLE `isucari`.`categories`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `categories` WHERE `id` = 5\G

# Query 4: 2.05 QPS, 0.36x concurrency, ID 0x534F6185E0A0C71693761CC3349B416F at byte 266530073
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.04
# Time range: 2023-10-20T10:24:53 to 2023-10-20T10:25:50
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0     117
# Exec time     10     21s    54ms   412ms   177ms   356ms    84ms   148ms
# Lock time      0    10ms    30us     1ms    84us   260us   153us    35us
# Rows sent      2   5.60k      49      49      49      49       0      49
# Rows examine  14   5.59M  48.88k  48.91k  48.90k  46.68k       0  46.68k
# Query size     0  24.34k     213     213     213     213       0     213
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms
#  10ms  #########
# 100ms  ################################################################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'items'\G
#    SHOW CREATE TABLE `isucari`.`items`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `items` WHERE `status` IN ('on_sale','sold_out') AND (`created_at` < '2019-08-12 15:48:55'  OR (`created_at` <= '2019-08-12 15:48:55' AND `id` < 49728)) ORDER BY `created_at` DESC, `id` DESC LIMIT 49\G
```
:::
:::tip
今回、initializeのinsert文が出力されてしまって面倒なので、以下のようにして2000文字以下のクエリのみをカウントするとスッキリします。
```shell
sudo pt-query-digest --filter 'length($$event->{arg}) <= 2000' /var/log/mysql/mysql-slow.log
```
:::
## ログローテーションについて
次回ベンチマークを実行時、ログファイルは新しく生成されるのではなく、既存のログファイルに追記されてしまいます。  
各ベンチマークのログで解析したい競技中は、毎回のベンチマークでログファイルを削除や移動することで、ログファイルを再生成させるということをします。  
スロークエリログの場合は、解析した結果をどこかへ保存しておいて、生ログは消してしまう人が多いと思います。  
解析した結果を`~/isucari/log`に保存し、生のログファイルを削除するには、以下のコマンドを実行します。
```shell
mkdir ~/isucari/log 
sudo pt-query-digest /var/log/mysql/mysql-slow.log > ~/isucari/log/$(date +mysql-slow.log-%m-%d-%H-%M -d "+9 hours")
sudo rm /var/log/mysql/mysql-slow.log
```
これを毎回ベンチマークを回すときに手動でやると、面倒だし忘れるので、シェルスクリプト等を用いて自動化すると良いでしょう。

## スロークエリログの解析結果のまとめを見る
ログの最初の方に、以下のような結果が表示されています。
```
# Profile
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0x5AF10ED6AD345D4B930FF1E60F9B9ED6  46.2205 22.8%    688 0.0672  0.05 SELECT items
#    2 0xDA556F9115773A1A99AA0165670CE848  26.9822 13.3% 176569 0.0002  0.01 ADMIN PREPARE
#    3 0xE1FCE50427E80F4FD12C53668328DB0D  24.9174 12.3% 115017 0.0002  0.00 SELECT categories
#    4 0x534F6185E0A0C71693761CC3349B416F  20.6844 10.2%    117 0.1768  0.04 SELECT items
#    5 0x6D959E4C28C709C1312243B842F41381  17.4278  8.6%    167 0.1044  0.05 SELECT items
#    6 0x396201721CD58410E070DA9421CA8C8D  13.5860  6.7%  52730 0.0003  0.01 SELECT users
```
これは、スロークエリログの中で実行時間が長い順にクエリを並べ、簡潔にまとめたものです。  
主に重要な情報は3つで、`Response time`, `Calls`, `SELECT items`です。1番上のクエリを例に見てみましょう。  
`Response time`の`46.2205`が実行時間で、全体の実行時間の`22.8%`を占めています。  
`Calls`の`688`がこのクエリが実行された回数です。  
最後の`SELECT items`が、実際に実行されたクエリの概要で、このクエリは`items`テーブルからデータを取得するクエリだと分かります。  
このクエリだけで全体の`22.8%`を占めているので、このクエリを改善することで、全体のパフォーマンスも向上しそうですね。  
また、`Calls`は`688`とそこまで多くないのに、時間がかかっていることから、1回のクエリの実行時間が長いことが分かりますね。    

## 1クエリの詳細を見る
先ほどの`pt-query-digest`の出力結果の後半部分は、以下のような一つのクエリの分析結果が、繰り返される形で構成されています。以下は`Query 1`の分析結果です。
```
# Query 1: 11.10 QPS, 0.75x concurrency, ID 0x5AF10ED6AD345D4B930FF1E60F9B9ED6 at byte 266611062
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.05
# Time range: 2023-10-20T10:24:52 to 2023-10-20T10:25:54
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0     688 // [!code hl]
# Exec time     22     46s     8ms   427ms    67ms   180ms    58ms    44ms // [!code hl]
# Lock time      0    67ms    31us    17ms    98us   176us   684us    36us
# Rows sent     14  32.92k      49      49      49      49       0      49 // [!code hl]
# Rows examine  24   9.37M   3.84k  48.90k  13.95k  46.68k  15.13k   6.96k // [!code hl]
# Query size     0 169.83k     248     257  252.77  246.02       0  246.02
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution // [!code hl]
#   1us
#  10us
# 100us
#   1ms  #
#  10ms  ################################################################
# 100ms  #################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'items'\G
#    SHOW CREATE TABLE `isucari`.`items`\G　 // [!code hl]
# EXPLAIN /*!50100 PARTITIONS*/　 // [!code hl]
SELECT * FROM `items` WHERE `status` IN ('on_sale','sold_out') AND category_id IN (21, 22, 23, 24) AND (`created_at` < '2019-08-12 15:27:55'  OR (`created_at` <= '2019-08-12 15:27:55' AND `id` < 48470)) ORDER BY `created_at` DESC, `id` DESC LIMIT 49\G　 // [!code hl]
```
長々と書いてありますが、7, 8 行目の`total`の部分に先ほど見たまとめと同じ情報があります。  

ここで重要なのは、`Rows examine`です。これは、クエリに対してレスポンスを返すまでに**走査した行数のことです。**  
データーベース君は、求められた条件にマッチする値を返すために、テーブルの行を順番に見ていきます。この**走査した行数** とは、クエリを実行する際に、どれだけの行を見たかということです。  
`Rows examine`が多いということは、データーベース君がたくさんの行を見ているということです。たくさんの行を見るということは、それだけ時間がかかります。  

対して`Rows sent`は、クエリに対してレスポンスとして返した実際の行数です。つまり、`Rows examine`が`Rows sent`の値に近い程効率よく処理ができているということになります。  
今回の例を見てみると、900万行も走査しているのに、3万行しか返していないことが分かります。絶望的に効率が悪いですね。  

データーベースには、この`Rows examine`を極力少なくするために、**Index**というテーブルへの処理を高速化するためのデータ構造が用意されています。これを活用することで改善できそうです。  

また、最後らへんの行には、実際に実行されたクエリの例や、クエリに関する情報を集めるのに役立つコマンドが書かれています。`MySQL`の基本的なコマンドも少し書いておきます。
```shell
mysql -u isucari -pisucari
SHOW CREATE TABLE `isucari`.`items`\G
SHOW databases; # データベース一覧を表示(基本コマンド)
USE isucari; # データーベースを選択(基本コマンド)
SHOW tables; # テーブル一覧を表示(基本コマンド)
EXPLAIN /*!50100 PARTITIONS*/ SELECT * FROM `items` WHERE `status` IN ('on_sale','sold_out') AND category_id IN (21, 22, 23, 24) AND (`created_at` < '2019-08-12 15:27:55'  OR (`created_at` <= '2019-08-12 15:27:55' AND `id` < 48470)) ORDER BY `created_at`  24) AND (`created_at` < '2019-08-12 15:27:55'  OR (`created_at` <= '2019-08-12 15:27:55' AND `id` < 48470)) ORDER BY `created_at` DESC, DESC, `id` DESC LIMIT 49\G
```
:::details `SHOW CREATE TABLE `isucari`.`items`\G`出力結果
```
mysql> SHOW CREATE TABLE `isucari`.`items`\G
*************************** 1. row ***************************
       Table: items
Create Table: CREATE TABLE `items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `seller_id` bigint(20) NOT NULL,
  `buyer_id` bigint(20) NOT NULL DEFAULT '0',
  `status` enum('on_sale','trading','sold_out','stop','cancel') NOT NULL,
  `name` varchar(191) NOT NULL,
  `price` int(10) unsigned NOT NULL,
  `description` text NOT NULL,
  `image_name` varchar(191) NOT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
) ENGINE=InnoDB AUTO_INCREMENT=50034 DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)
```
:::
上記の出力で、注目するべきは、`KEY`の行です。`KEY`の行には、テーブルに貼られているIndexの情報が書かれています。  
`idx_category_id`という名前のIndexが貼られていることが分かります。このIndexは、`category_id`というカラムに貼られているIndexですね。
:::details `EXPLAIN ...`出力結果
```
mysql> EXPLAIN /*!50100 PARTITIONS*/ SELECT * FROM `items` WHERE `status` IN ('on_sale','sold_out') AND category_id IN (21, 22, 23, 24) AND (`created_at` < '2019-08-12 15:27:55'  OR (`created_at` <= '2019-08-12 15:27:55' AND `id` < 48470)) ORDER BY `created_at`  24) AND (`created_at` < '2019-08-12 15:27:55'  OR (`created_at` <= '2019-08-12 15:27:55' AND `id` < 48470)) ORDER BY `created_at` DESC, DESC, `id` DESC LIMIT 49\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: items
   partitions: NULL
         type: range
possible_keys: PRIMARY,idx_category_id
          key: idx_category_id
      key_len: 18
          ref: NULL
         rows: 8227
     filtered: 100.00
        Extra: Using index condition; Using filesort
1 row in set, 2 warnings (0.00 sec)
```
:::
上記の出力で、注目するべきは、`key`の行です。`key`の行には、クエリを実行する際に、どのIndexを使っているかが書かれています。  
また、さらに重要なのは、`Extra`の行です。`Extra`の行には、クエリを実行する際に、どのような処理をしているかが書かれています。  
ここでは、`Using index condition; Using filesort`と書いてありますね。`Using index condition`は、Indexを使っているということです。  
`Using filesort`は、`Index`を使用せずに結果をソートする必要がある場合に表示されます。つまり、何らかの影響で`Index`が使えていない箇所があるということです！これが遅い原因です！

## スロークエリログの解析結果から改善する
ISUCONの一番最初の改善として多いのが、「`Index`を貼る」です。  
先ほどの説明の通り、`Index`とは、テーブルへの処理を高速化するためのデータ構造の事で、`Index`を用いることでデータベーステーブルのすべての行を検索しなくても、検索条件に合致する行を高速に取得できるようになります。  
今回は、毎回ベンチマークが実行されるたびに`webapp/sql/01_schema.sql`の中のSQL文が実行されるので、ここに`Index`を貼る`SQL文を追加しましょう。
```mysql
ALTER TABLE `items` ADD INDEX idx_status_category_created_id (`status`, `category_id`, `created_at`, `id`);
```
https://github.com/pikachu0310/isucon-workshop-2023/commit/25285db714c8a40934ae2d55a6f6034603fc2549
## ADMIN PREPARE
2番目に、ADMIN PREPARE というクエリがあって、遅くなっていました。
```
# Profile
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0x5AF10ED6AD345D4B930FF1E60F9B9ED6  46.2205 22.8%    688 0.0672  0.05 SELECT items
#    2 0xDA556F9115773A1A99AA0165670CE848  26.9822 13.3% 176569 0.0002  0.01 ADMIN PREPARE
#    3 0xE1FCE50427E80F4FD12C53668328DB0D  24.9174 12.3% 115017 0.0002  0.00 SELECT categories
#    4 0x534F6185E0A0C71693761CC3349B416F  20.6844 10.2%    117 0.1768  0.04 SELECT items
#    5 0x6D959E4C28C709C1312243B842F41381  17.4278  8.6%    167 0.1044  0.05 SELECT items
```
`ADMIN PREPARE`というクエリが、`26.9822`秒もかかっているのが分かります。
これは典型問題で、以下の様に`&interpolateParams=true`というパラメータを追加することで改善できます。
https://github.com/pikachu0310/isucon-workshop-2023/commit/953cfb75069903f9b4e5882337c317eb249bd7cd
:::tip 参考
[MySQL :: MySQL 8.0 リファレンスマニュアル :: 13.5 プリペアドステートメント](https://dev.mysql.com/doc/refman/8.0/ja/sql-prepared-statements.html)  
[go-sql-driver#interpolateparams](https://github.com/go-sql-driver/mysql#interpolateparams)
:::

## 再度計測してみる
再びログローテーションをした後に計測をしてみると、以下のようになりました。
```
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0xE1FCE50427E80F4FD12C53668328DB0D  32.1162 21.3% 152077 0.0002  0.00 SELECT categories
#    2 0x5AF10ED6AD345D4B930FF1E60F9B9ED6  25.3081 16.8%    998 0.0254  0.06 SELECT items
#    3 0x6D959E4C28C709C1312243B842F41381  17.5491 11.6%    180 0.0975  0.06 SELECT items
#    4 0x396201721CD58410E070DA9421CA8C8D  16.9213 11.2%  71323 0.0002  0.00 SELECT users
#    5 0x534F6185E0A0C71693761CC3349B416F  16.1589 10.7%    117 0.1381  0.07 SELECT items
```
`ADMIN PREPARE`が消えて、先ほど1位だった`SELECT items`が少し改善され2位になり、今度は`SELECT categories`が1番遅くなっていることが分かります。  
:::details Query1
```
# Query 1: 2.45k QPS, 0.52x concurrency, ID 0xE1FCE50427E80F4FD12C53668328DB0D at byte 130021867
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.00
# Time range: 2023-10-21T12:08:02 to 2023-10-21T12:09:04
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         64  152077
# Exec time     21     32s    54us    47ms   211us   626us   500us    89us
# Lock time     55      8s    15us    47ms    50us   119us   224us    28us
# Rows sent     48 148.51k       1       1       1       1       0       1
# Rows examine   0 148.51k       1       1       1       1       0       1
# Query size     4   6.08M      41      42   41.89   40.45       0   40.45
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  #####################################################
#   1ms  ##
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'categories'\G
#    SHOW CREATE TABLE `isucari`.`categories`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `categories` WHERE `id` = 65\G
```
:::
今回1位になった`SELECT categories`を`EXPLAIN`してみると、以下のようになります。
```
mysql> EXPLAIN /*!50100 PARTITIONS*/
    -> SELECT * FROM `categories` WHERE `id` = 65\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: categories
   partitions: NULL
         type: const
possible_keys: PRIMARY
          key: PRIMARY
      key_len: 4
          ref: const
         rows: 1
     filtered: 100.00
        Extra: NULL
1 row in set, 2 warnings (0.01 sec)
```
`key`の行に`PRIMARY`と書いてあり、`Extra`の行に`NULL`と書いてあります。  
`Rows sent`と`Rows examine`が同じ値で、`key`の行にデフォルトのINDEXである`PRIMARY`と書いてあることから、`Index`が使われていることが分かります。  
つまり、このクエリは十分高速です。しかし`Count`が`152077`とめちゃくちゃ多いことから、アプリケーション側の問題そうです。  
`Count`がめちゃくちゃ多いクエリは、アプリケーション側でN+1問題が起きていることが多いです。  

アプリケーションを触る必要がありそうなので、とりあえずデーターベースの改善はこれ位にして、アプリケーション側の改善に移るために、次のアクセスログの章でアクセスログを解析してみましょう。

