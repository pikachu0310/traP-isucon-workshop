# 本格的な計測の準備をしよう

本格的に計測用のツールを導入して、計測を行う準備をします。
:::tip 計測はログを出力する分、パフォーマンスが落ちる
計測は非常に有用で必須ですが、ログを取る分余分に処理が走るので、パフォーマンスが落ち、スコアが少し下がります。  
なので、競技の終わりが近づいてきてガチで点数を狙いに行くときに、全てのログをオフにするなどをするのが一般的です。
:::

## スロークエリログ(Slow Query Log)の設定

MySQLには実行時間が長いSQLクエリを記録するスロークエリログ機能があり、これはボトルネックの特定に役立ちます。  
しかし、デフォルトではこの機能はOFFです。  スロークエリログをONにするには、MySQLの設定ファイル(`/etc/mysql/mysql.conf.d/mysqld.cnf`)を直接編集します。  
設定ファイルを表示するには、サーバー上で`cat /etc/mysql/mysql.conf.d/mysqld.cnf`を実行します。
```{2,3,4}
# Here you can see queries with especially long duration
#slow_query_log         = 1
#slow_query_log_file    = /var/log/mysql/mysql-slow.log
#long_query_time = 2
#log-queries-not-using-indexes
```
とても長いファイルですが、76, 77, 78 行目にスロークエリの設定があります。  
76, 77, 78 行目の先頭にある`#`を削除し、`long_query_time`を`0`に変更します。  
`sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf`で書き換えましょう。(`vim`でも大丈夫です。)
```{2,3,4}
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
mkdir ~/tools && cd ~/tools
wget https://github.com/percona/percona-toolkit/archive/refs/tags/v3.5.5.tar.gz
tar zxvf v3.5.5.tar.gz
./percona-toolkit-3.5.5/bin/pt-query-digest --version
sudo install ./percona-toolkit-3.5.5/bin/pt-query-digest /usr/local/bin
pt-query-digest --version
```
最後の`pt-query-digest --version`でバージョンが表示されれば成功です。  
`pt-query-digest`は、スロークエリログを解析して、どのクエリが遅いのかをいい感じに表示して教えてくれるツールです。

## 実際に計測する！

まずは、再度ベンチマークを回してスロークエリログを取得しましょう。  
`{"pass":true,"score":2110,"campaign":0,"language":"Go","messages":[]}`
ログを取っている分少しだけスコアが下がりましたね。  
では、以下のコマンドを実行して、`pt-query-digest`でスロークエリログを解析してみましょう。
```shell
pt-query-digest /var/log/mysql/mysql-slow.log
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

# Query 5: 2.69 QPS, 0.28x concurrency, ID 0x6D959E4C28C709C1312243B842F41381 at byte 260396339
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.05
# Time range: 2023-10-20T10:24:52 to 2023-10-20T10:25:54
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0     167
# Exec time      8     17s    26ms   310ms   104ms   230ms    70ms    78ms
# Lock time      0    10ms    24us     2ms    62us   176us   157us    28us
# Rows sent      1   4.33k       0      49   26.57   46.83   22.62   46.83
# Rows examine  20   7.97M  48.83k  48.91k  48.87k  46.68k       0  46.68k
# Query size     0  23.10k     140     142  141.63  136.99       0  136.99
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms
#  10ms  ################################################################
# 100ms  ###############################################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'items'\G
#    SHOW CREATE TABLE `isucari`.`items`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `items` WHERE `seller_id` = 2760 AND `status` IN ('on_sale','trading','sold_out') ORDER BY `created_at` DESC, `id` DESC LIMIT 49\G

# Query 6: 836.98 QPS, 0.22x concurrency, ID 0x396201721CD58410E070DA9421CA8C8D at byte 302936203
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.01
# Time range: 2023-10-20T10:24:52 to 2023-10-20T10:25:55
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          9   52730
# Exec time      6     14s    50us   405ms   257us   725us     2ms    93us
# Lock time     22      2s    10us    20ms    34us    66us   186us    17us
# Rows sent     22  51.49k       1       1       1       1       0       1
# Rows examine   0  51.49k       1       1       1       1       0       1
# Query size     0   1.95M      36      39   38.72   38.53    0.80   38.53
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  #####################################################
#   1ms  ###
#  10ms  #
# 100ms  #
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'users'\G
#    SHOW CREATE TABLE `isucari`.`users`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `users` WHERE `id` = 2404\G

# Query 7: 1.87 QPS, 0.20x concurrency, ID 0x528C15CEBCCFADFD36DB5799406088D9 at byte 267655714
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.06
# Time range: 2023-10-20T10:24:52 to 2023-10-20T10:25:54
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0     116
# Exec time      6     13s    25ms   324ms   109ms   279ms    80ms    73ms
# Lock time      0     6ms    32us   251us    53us   185us    47us    36us
# Rows sent      1   3.74k      15      49   33.03   46.83   15.14   46.83
# Rows examine  14   5.54M  48.85k  48.91k  48.88k  46.68k       0  46.68k
# Query size     0  27.78k     243     246  245.26  234.30       0  234.30
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms
#  10ms  ################################################################
# 100ms  #####################################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'items'\G
#    SHOW CREATE TABLE `isucari`.`items`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `items` WHERE `seller_id` = 197 AND `status` IN ('on_sale','trading','sold_out') AND (`created_at` < '2019-08-12 04:07:03'  OR (`created_at` <= '2019-08-12 04:07:03' AND `id` < 7622)) ORDER BY `created_at` DESC, `id` DESC LIMIT 49\G

# Query 8: 1.73 QPS, 0.14x concurrency, ID 0x6688844580F541EC2C1B6BE83F13FC2B at byte 265771118
# This item is included in the report because it matches --limit.
# Scores: V/M = 0.03
# Time range: 2023-10-20T10:24:52 to 2023-10-20T10:25:54
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0     107
# Exec time      4      9s    30ms   325ms    80ms   163ms    50ms    68ms
# Lock time      0     6ms    25us   428us    52us   138us    67us    30us
# Rows sent      0     977       4      11    9.13   10.84    2.29   10.84
# Rows examine  13   5.11M  48.84k  48.87k  48.86k  46.68k       0  46.68k
# Query size     0  18.82k     177     181  180.12  174.84    0.00  174.84
# String:
# Databases    isucari
# Hosts        localhost
# Users        isucari
# Query_time distribution
#   1us
#  10us
# 100us
#   1ms
#  10ms  ################################################################
# 100ms  ##########################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucari` LIKE 'items'\G
#    SHOW CREATE TABLE `isucari`.`items`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `items` WHERE (`seller_id` = 2404 OR `buyer_id` = 2404) AND `status` IN ('on_sale','trading','sold_out','cancel','stop') ORDER BY `created_at` DESC, `id` DESC LIMIT 11\G
```
:::
先ほどの`pt-query-digest`の出力結果は、以下のような一つのクエリの分析結果が、繰り返される形で構成されています。以下は`Query 1`の分析結果です。
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
```
長々と書いてありますが、一番見るべきところは、7, 8 行目の`total`の部分です。  
7 行目の`total`である`688`という数字は、そのクエリが呼び出された回数です。  
8 行目の`total`である`46s`は、そのクエリの実行時間の合計です。

今ここを書いています。