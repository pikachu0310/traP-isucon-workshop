# スロークエリログ (pt-query-digest)
スロークエリログを解析することで、実行に時間がかかっているクエリを見つけ出します。

## スロークエリログの設定

MySQLには実行時間が長いSQLクエリを記録するスロークエリログ機能があり、これはボトルネックの特定に役立ちます。  
しかし、デフォルトではこの機能はOFFです。  スロークエリログをONにするには、MySQLの設定ファイル(`/etc/mysql/mariadb.conf.d/50-server.cnf`)を直接編集します。  
設定ファイルを表示するには、サーバー上で`cat /etc/mysql/mariadb.conf.d/50-server.cnf`を実行します。
```:line-numbers=64{2,3,13}
# Enable the slow query log to see queries with especially long duration
#slow_query_log_file    = /var/log/mysql/mariadb-slow.log
#long_query_time        = 10
#log_slow_rate_limit    = 1000
#log_slow_verbosity     = query_plan
#log-queries-not-using-indexes

(省略)

# This group is only read by MariaDB servers, not by MySQL.
# If you use the same .cnf file for MySQL and MariaDB,
# you can put MariaDB-only options here
[mariadb]

# This group is only read by MariaDB-10.3 servers.
```
とても長いファイルですが、65, 66 行目にスロークエリの設定があります。  
65, 66 行目の先頭にある`#`を削除し、`long_query_time`を`0`に変更します。  
また、128 行目の`[mariadb]`の下に`slow_query_log`を追加します。  
`sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf`で書き換えましょう。(`vim`でも大丈夫です。)
```:line-numbers=64{2,3,13,14}
# Enable the slow query log to see queries with especially long duration
slow_query_log_file    = /var/log/mysql/mariadb-slow.log
long_query_time        = 0
#log_slow_rate_limit    = 1000
#log_slow_verbosity     = query_plan
#log-queries-not-using-indexes

(省略)

# This group is only read by MariaDB servers, not by MySQL.
# If you use the same .cnf file for MySQL and MariaDB,
# you can put MariaDB-only options here
[mariadb]
slow_query_log

# This group is only read by MariaDB-10.3 servers.
```
`slow_query_log`は、スロークエリログを有効にするかどうかの設定です。  
`slow_query_log_file`は、スロークエリログの出力先のファイル名です。  
`long_query_time`以上に実行に時間がかかったクエリが、スロークエリログとして出力されます。  
これを0にすることで、全てのクエリをスロークエリとして記録します。
:::tip 設定ファイルの探し方(MySQLの場合)
MySQLの設定ファイルは、`/etc/mysql/my.cnf ~/.my.cnf /usr/etc/my.cnf`の順番に読み込まれます。  
スロークエリログで探せばよいのは、ファイル名が`mysqld.cnf`で、その中の`[mysqld]`というセクションです。  
基本的には`/etc/mysql/my.cnf`の中身を見て、探していくと良いでしょう。  
今回はMariaDBなので、少しだけ場所が違います。
:::

## スロークエリログの確認

では、スロークエリログが有効になったかを確かめましょう。  
まず、先ほどの設定ファイルを反映するために、以下のコマンドで`MySQL`を再起動します。 
```shell
sudo systemctl restart mysql
```
`MySQL`を再起動したら、以下のコマンドを実行して`MySQL`に入りましょう。
```shell
mysql -u isucon -pisucon
```
`MySQL`の中で`show variables like 'slow%';`を実行し、`MySQL`のスロークエリログの設定を確認します。
```
MariaDB [(none)]> show variables like 'slow%';
+---------------------+---------------------------------+
| Variable_name       | Value                           |
+---------------------+---------------------------------+
| slow_launch_time    | 2                               |
| slow_query_log      | ON                              |
| slow_query_log_file | /var/log/mysql/mariadb-slow.log |
+---------------------+---------------------------------+
3 rows in set (0.001 sec)
```
上の6行目を見ると、`slow_query_log`が`ON`になっています。  
これでスロークエリログが有効になりました！(`exit`で抜けれます。)  

## スロークエリを解析するツールを導入する

今回は`pt-query-digest`というツールを使います。  
以下のコマンドを実行して、`pt-query-digest`をインストールしましょう。
```shell
mkdir ~/tools
cd ~/tools
wget https://github.com/percona/percona-toolkit/archive/refs/tags/v3.6.0.tar.gz
tar zxvf v3.6.0.tar.gz
./percona-toolkit-3.6.0/bin/pt-query-digest --version
sudo install ./percona-toolkit-3.6.0/bin/pt-query-digest /usr/local/bin
pt-query-digest --version
```
最後の`pt-query-digest --version`でバージョンが表示されれば成功です！  
`pt-query-digest`は、スロークエリログを解析して、どのクエリが遅いのかをいい感じに表示して教えてくれるツールです。

## 実際に計測し、スロークエリログを解析する

まずは、再度ベンチマークを回してスロークエリログを取得しましょう。  
```
17:17:47.960023 score: 8139(8142 - 3) : pass
17:17:47.960034 deduction: 0 / timeout: 38
```

ログを取っている分少しだけスコアが下がりましたね。  
:::tip 計測はログを出力する分、パフォーマンスが落ちる
計測は非常に有用で必須ですが、ログを取る分余分に処理が走るので、パフォーマンスが落ち、スコアが少し下がります。  
なので、競技の終わりが近づいてきてガチで点数を狙いに行くときに、全てのログをオフにするなどをするのが一般的です。
:::
では、以下のコマンドを実行して、`pt-query-digest`でスロークエリログを解析してみましょう。  
(Reading from STDIN ... で硬直していたら失敗しているので、`Ctrl + C`で終了してコマンドを確認してください。)  
```shell
sudo pt-query-digest /var/log/mysql/mariadb-slow.log
```
:::details 出力結果の一部
```
isucon@ip-192-168-0-11:~/tools$ sudo pt-query-digest /var/log/mysql/mariadb-slow.log

# 27.2s user time, 160ms system time, 36.03M rss, 43.32M vsz
# Current date: Fri Nov 15 17:19:35 2024
# Hostname: ip-192-168-0-11
# Files: /var/log/mysql/mariadb-slow.log
# Overall: 322.64k total, 96 unique, 1.18k QPS, 1.68x concurrency ________
# Time range: 2024-11-15 17:13:15 to 17:17:49
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time           459s       0   372ms     1ms     2ms    10ms    21us
# Lock time             2s       0    36ms     7us    12us   144us       0
# Rows sent          2.05M       0   1.61k    6.67    0.99   70.10       0
# Rows examine     190.66M       0  74.42k  619.65       0   4.89k       0
# Rows affecte      72.98k       0     618    0.23    0.99    1.12       0
# Bytes sent       569.95M       0 646.20k   1.81k  621.67  14.09k   12.54
# Query size        29.93M       6 790.36k   97.28  258.32   1.49k   31.70
# Boolean:
# QC hit         5% yes,  94% no

# Profile
# Rank Query ID                            Response time  Calls  R/Call V/
# ==== =================================== ============== ====== ====== ==
#    1 0x931A992E852C61FC6D46141A39DEF4FE  186.9350 40.7%   5490 0.0341  0.05 SELECT isu_condition
#    2 0x9C6C682008AE0D08F3E2A0049B030C70  102.3632 22.3%   1349 0.0759  0.03 SELECT isu_condition
#    3 0x8155B89FFD74A9D523D19AC409FD97AF   73.2049 15.9%   1623 0.0451  0.05 SELECT isu_condition
#    4 0xFFFCA4D67EA0A788813031B8BBC3B329   37.6837  8.2%   8151 0.0046  0.00 COMMIT
#    5 0x5F580A12ADA1633C9634298BE5BD9422   26.1556  5.7%    387 0.0676  0.03 SELECT isu_condition
#    6 0xDA556F9115773A1A99AA0165670CE848   14.1709  3.1% 101977 0.0001  0.00 ADMIN PREPARE
# MISC 0xMISC                               18.8304  4.1% 203664 0.0001   0.0 <90 ITEMS>

# Query 1: 88.55 QPS, 3.02x concurrency, ID 0x931A992E852C61FC6D46141A39DEF4FE at byte 107969301
# Scores: V/M = 0.05
# Time range: 2024-11-15 17:16:47 to 17:17:49
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          1    5490
# Exec time     40    187s     6us   372ms    34ms   122ms    41ms    16ms
# Lock time     10   269ms       0    14ms    49us    47us   434us     8us
# Rows sent     64   1.32M       0   1.61k  251.90   1.20k  374.68   69.19
# Rows examine  49  93.54M       0  74.42k  17.45k  62.55k  19.18k   8.06k
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    36 208.95M     589 256.38k  38.97k 182.98k  57.78k  10.80k
# Query size     2 616.55k     115     115     115     115       0     115
# Boolean:
# QC hit         5% yes,  94% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  #####
# 100us  #########
#   1ms  ##################################
#  10ms  ################################################################
# 100ms  ############
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '9bf796ff-623a-4f24-8f67-464870ad60f8' ORDER BY timestamp DESC\G

# Query 2: 22.11 QPS, 1.68x concurrency, ID 0x9C6C682008AE0D08F3E2A0049B030C70 at byte 107915497
# Scores: V/M = 0.03
# Time range: 2024-11-15 17:16:47 to 17:17:48
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0    1349
# Exec time     22    102s   200us   361ms    76ms   163ms    50ms    68ms
# Lock time      3    93ms     5us    19ms    68us    54us   711us     9us
# Rows sent     22 481.42k       0   1.40k  365.43  918.49  288.67  284.79
# Rows examine  23  45.30M     628  74.13k  34.39k  62.55k  18.92k  30.09k
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    13  74.47M     589 221.72k  56.53k 143.37k  45.07k  42.34k
# Query size     0 206.83k     157     157     157     157       0     157
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us
# 100us  #
#   1ms  ######
#  10ms  ################################################################
# 100ms  ##################################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '66e50370-e766-4bfb-bbf1-37bb0dab9ae7'     AND `timestamp` < '2021-08-24 22:28:25'       ORDER BY `timestamp` DESC\G

# Query 3: 26.61 QPS, 1.20x concurrency, ID 0x8155B89FFD74A9D523D19AC409FD97AF at byte 107780161
# Scores: V/M = 0.05
# Time range: 2024-11-15 17:16:47 to 17:17:48
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0    1623
# Exec time     15     73s   149us   276ms    45ms   141ms    47ms    26ms
# Lock time      6   166ms     4us    36ms   101us   108us     1ms     8us
# Rows sent      0   1.52k       0       1    0.96    0.99    0.19    0.99
# Rows examine  19  37.80M     619  72.33k  23.85k  68.96k  21.10k  15.96k
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0   1.14M     589     789  738.87  755.64   33.51  719.66
# Query size     0 198.12k     125     125     125     125       0     125
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us
# 100us  #######
#   1ms  ########################
#  10ms  ################################################################
# 100ms  ################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'b668fd36-258b-4753-8405-414608065f46' ORDER BY `timestamp` DESC LIMIT 1\G

# Query 4: 133.62 QPS, 0.62x concurrency, ID 0xFFFCA4D67EA0A788813031B8BBC3B329 at byte 106111660
# Scores: V/M = 0.00
# Time range: 2024-11-15 17:16:47 to 17:17:48
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          2    8151
# Exec time      8     38s     3us    70ms     5ms    11ms     4ms     4ms
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0  87.56k      11      11      11      11       0      11
# Query size     0  47.76k       6       6       6       6       0       6
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  #
# 100us  ##
#   1ms  ################################################################
#  10ms  #####
# 100ms
#    1s
#  10s+
COMMIT\G

# Query 5: 6.34 QPS, 0.43x concurrency, ID 0x5F580A12ADA1633C9634298BE5BD9422 at byte 89657890
# Scores: V/M = 0.03
# Time range: 2024-11-15 17:16:47 to 17:17:48
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0     387
# Exec time      5     26s     8us   254ms    68ms   148ms    48ms    65ms
# Lock time      0    12ms       0     2ms    31us    49us   149us     8us
# Rows sent     11 241.88k      12   1.46k     640   1.20k  398.03  592.07
# Rows examine   6  12.49M       0  73.97k  33.06k  65.68k  20.05k  33.17k
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     6  37.31M   2.22k 228.96k  98.73k 201.74k  62.24k  92.42k
# Query size     0  43.84k     116     116     116     116       0     116
# Boolean:
# QC hit         2% yes,  97% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  ##
# 100us  ####
#   1ms  ##########
#  10ms  ################################################################
# 100ms  #################################
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'f474d8e8-ea74-496a-a9ee-854ef0019e94' ORDER BY `timestamp` ASC\G
```
:::
:::tip
今回は無いのですが、initializeのinsert文が出力されてしまった場合は、以下のようにして2000文字以下のクエリのみをカウントするなどの工夫でスッキリします。
```shell
sudo pt-query-digest --filter 'length($$event->{arg}) <= 2000' /var/log/mysql/mysql-slow.log
```
:::
## ログローテーションについて
次回ベンチマークを実行時、ログファイルは新しく生成されるのではなく、既存のログファイルに追記されてしまいます。  
各ベンチマークのログで解析したい競技中は、毎回のベンチマークでログファイルを削除や移動することで、ログファイルを再生成させるということをします。  
スロークエリログの場合は、解析した結果をどこかへ保存しておいて、生ログは消してしまう人が多いと思います。  
解析した結果を`~/log`に保存し、生のログファイルを削除するには、以下のコマンドを実行します。
```shell
mkdir ~/log 
sudo pt-query-digest /var/log/mysql/mariadb-slow.log > ~/log/$(date +mysql-slow.log-%m-%d-%H-%M -d "+9 hours")
sudo rm /var/log/mysql/mariadb-slow.log
sudo systemctl restart mysql # MySQLのログの出力先を消したため、再起動してログファイルを再生成
```
これを毎回ベンチマークを回すときに手動でやると、面倒だし忘れるので、シェルスクリプト等を用いて自動化すると良いでしょう。

## スロークエリログの解析結果のまとめを見る
ログの最初の方に、以下のような結果が表示されています。
```
# Profile
# Rank Query ID                            Response time  Calls  R/Call V/
# ==== =================================== ============== ====== ====== ==
#    1 0x931A992E852C61FC6D46141A39DEF4FE  186.9350 40.7%   5490 0.0341  0.05 SELECT isu_condition
#    2 0x9C6C682008AE0D08F3E2A0049B030C70  102.3632 22.3%   1349 0.0759  0.03 SELECT isu_condition
#    3 0x8155B89FFD74A9D523D19AC409FD97AF   73.2049 15.9%   1623 0.0451  0.05 SELECT isu_condition
#    4 0xFFFCA4D67EA0A788813031B8BBC3B329   37.6837  8.2%   8151 0.0046  0.00 COMMIT
#    5 0x5F580A12ADA1633C9634298BE5BD9422   26.1556  5.7%    387 0.0676  0.03 SELECT isu_condition
#    6 0xDA556F9115773A1A99AA0165670CE848   14.1709  3.1% 101977 0.0001  0.00 ADMIN PREPARE
# MISC 0xMISC                               18.8304  4.1% 203664 0.0001   0.0 <90 ITEMS>
```
これは、スロークエリログの中で実行時間が長い順にクエリを並べ、簡潔にまとめたものです。  
主に重要な情報は3つで、`Response time`, `Calls`, `SELECT isu_condition`です。1番上のクエリを例に見てみましょう。  
`Response time`の`186.9350`が実行時間で、全体の実行時間の`40.7%`を占めています。  
`Calls`の`5490`がこのクエリが実行された回数です。  
最後の`SELECT isu_condition`が、実際に実行されたクエリの概要で、このクエリは`isu_condition`テーブルからデータを取得するクエリだと分かります。  
このクエリだけで全体の`40.7%`を占めているので、このクエリを改善することで、全体のパフォーマンスも向上しそうですね。  
また、`Calls`は`5490`とそこまで多くないのに、時間がかかっていることから、1回のクエリの実行時間が長いことが分かりますね。    

## 1クエリの詳細を見る
先ほどの`pt-query-digest`の出力結果の後半部分は、以下のような一つのクエリの分析結果が、繰り返される形で構成されています。以下は`Query 1`の分析結果です。
```
# Query 1: 88.55 QPS, 3.02x concurrency, ID 0x931A992E852C61FC6D46141A39DEF4FE at byte 107969301
# Scores: V/M = 0.05
# Time range: 2024-11-15 17:16:47 to 17:17:49
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          1    5490
# Exec time     40    187s     6us   372ms    34ms   122ms    41ms    16ms
# Lock time     10   269ms       0    14ms    49us    47us   434us     8us
# Rows sent     64   1.32M       0   1.61k  251.90   1.20k  374.68   69.19
# Rows examine  49  93.54M       0  74.42k  17.45k  62.55k  19.18k   8.06k
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    36 208.95M     589 256.38k  38.97k 182.98k  57.78k  10.80k
# Query size     2 616.55k     115     115     115     115       0     115
# Boolean:
# QC hit         5% yes,  94% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  #####
# 100us  #########
#   1ms  ##################################
#  10ms  ################################################################
# 100ms  ############
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '9bf796ff-623a-4f24-8f67-464870ad60f8' ORDER BY timestamp DESC\G
```
長々と書いてありますが、7, 8 行目の`total`の部分に先ほど見たまとめと同じ情報(`187s`)があります。  

ここで重要なのは、`Rows examine`です。これは、クエリに対してレスポンスを返すまでに**走査した行数のことです。**  
データーベース君は、求められた条件にマッチする値を返すために、テーブルの行を順番に見ていきます。この**走査した行数** とは、クエリを実行する際に、どれだけの行を見たかということです。  
`Rows examine`が多いということは、データーベース君がたくさんの行を見ているということです。たくさんの行を見るということは、それだけ時間がかかります。  

対して`Rows sent`は、クエリに対してレスポンスとして返した実際の行数です。つまり、`Rows examine`が`Rows sent`の値に近い程効率よく処理ができているということになります。  
今回の例を見てみると、9354万行も走査しているのに、132万行しか返していないことが分かります。探索の効率がかなり悪いですね。  

データーベースには、この`Rows examine`を極力少なくするために、**Index**というテーブルへの処理を高速化するためのデータ構造が用意されています。これを活用することで改善できそうです。  

また、最後らへんの行には、実際に実行されたクエリの例や、クエリに関する情報を集めるのに役立つコマンドが書かれています。`MySQL`の基本的なコマンドも少し書いておきます。
```shell
mysql -u isucon -pisucon
SHOW databases; # データベース一覧を表示(基本コマンド)
USE isucondition; # データーベースを選択(基本コマンド)
SHOW tables; # テーブル一覧を表示(基本コマンド)
SHOW CREATE TABLE `isu_condition`\G # テーブルの構造を表示
EXPLAIN SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '9bf796ff-623a-4f24-8f67-464870ad60f8' ORDER BY timestamp DESC\G
```
:::details SHOW CREATE TABLE `isucondition`.`isu_condition`\G 出力結果
```
MariaDB [isucondition]> SHOW CREATE TABLE `isucondition`.`isu_condition`\G
*************************** 1. row ***************************
       Table: isu_condition
Create Table: CREATE TABLE `isu_condition` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `jia_isu_uuid` char(36) NOT NULL,
  `timestamp` datetime NOT NULL,
  `is_sitting` tinyint(1) NOT NULL,
  `condition` varchar(255) NOT NULL,
  `message` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=74562 DEFAULT CHARSET=utf8mb4
1 row in set (0.000 sec)
```
:::
上記の出力で、注目するべきは、`KEY`の行です。`KEY`の行には、テーブルに貼られているIndexの情報が書かれています。  
今回は、`KEY`という行が存在しなくて、`PRIMARY KEY`のみが存在しています。`PRIMARY KEY`は、テーブルの行を一意に識別するためのIndexです。  
`KEY`という行が存在しないという事は、他にIndexは貼られていないので、`Rows examine`が多いのは、Indexがないことが原因かもしれません。  
:::details `EXPLAIN SELECT ...` 出力結果
```
MariaDB [isucondition]> EXPLAIN SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '9bf796ff-623a-4f24-8f67-464870ad60f8' ORDER BY timestamp DESC\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: isu_condition
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 73961
        Extra: Using where; Using filesort
1 row in set (0.000 sec)
```
:::
上記の出力で注目するべきは、またもや`key`の行です。`key`の行には、クエリを実行する際に、どのIndexを使っているかが書かれています。  
また、同じように重要なのは、`Extra`の行です。`Extra`の行には、クエリを実行する際に、どのような処理をしているかが書かれています。  
ここでは、`Using where; Using filesort`と書いてありますね。これは、`where`句を使っていることと、`filesort`を使っていることを示しています。  
また、`type`の行には、`ALL`と書いてあります。`ALL`とは、全行を走査していることを示しています。これこそが遅い原因ですね！  
`where`句に対して`Index`を貼ることで、毎回全行を走査することなく、条件に合致する行を高速に取得できるようになり、改善することができそうです！  
このように、計測をしてボトルネックを見つけ、なぜ遅いのかを理解し、改善するための方針を立てることが重要です！

## スロークエリログの解析結果から改善する
ISUCONの一番最初の改善として多いのが、「`Index`を貼る」です。  
先ほどの説明の通り、`Index`とは、テーブルへの処理を高速化するためのデータ構造の事で、`Index`を用いることでデータベーステーブルのすべての行を検索しなくても、検索条件に合致する行を高速に取得できるようになります。  
参考: [Index](https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html)  
このクエリを見てみましょう。  
``SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '9bf796ff-623a-4f24-8f67-464870ad60f8' ORDER BY timestamp DESC\G``  
`WHERE`で`jia_isu_uuid`を指定しているので、`jia_isu_uuid`に対して`Index`を貼ることで、`jia_isu_uuid`が一致する行を高速に取得できるようになります。

今回は、毎回ベンチマークが実行されるたびに`webapp/sql/0_Schema.sql`の中のSQL文が実行されるので、ここに`Index`を貼る`SQL文を追加しましょう。(これはアプリケーションのコードを読むとわかります。)  
```sql
ALTER TABLE isu_condition ADD INDEX jia_isu_uuid_index (jia_isu_uuid);
```
上記を`webapp/sql/0_Schema.sql`の末尾に追加しましょう。`webapp/sql/0_Schema.sql`は`Git`管理しているので、自分のPC上のエディタを用いてファイルを編集し、`Git`で`commit`&`push`して、`ISUCON`サーバー側で`pull`することで反映させましょう。  
```shell
# 自分のPC上で webapp/sql/0_Schema.sql を編集した後、自分のPC上で以下のコマンド
git add webapp/sql/0_Schema.sql
git commit -m ":zap: isu_condition の jia_isu_uuid に INDEX を追加"
git push origin main

# ISUCONサーバー側で
git pull
sudo systemctl restart mysql # MySQLのログの出力先を消したため、再起動してログファイルを再生成
```
反映できたら、改善できたかどうかを確認するために、そして次のボトルネックを見つけるための計測をするために、ベンチマークを回しましょう！すると...  
```
17:53:04.796112 score: 18868(18870 - 2) : pass
17:53:04.796122 deduction: 0 / timeout: 22
```
スコアが2倍に伸びました！！！うおおおおおおおおおおおおおおおおおおおおおおおおおお！！！！！  
ボトルネックを改善すると、より高速で処理できるようになり、リクエストを沢山さばけるようになるため、スコアが一気に上がりました！  
スコアが伸びると、嬉しい！！！楽しい！！！！！この調子で、どんどんボトルネックを発見し改善していきましょう！！！

## 次のボトルネックを探す
さて、再度ベンチマークを回したことで新しくログが生成されたので、そのログを解析して次のボトルネックを探してみましょう！  

```shell
sudo pt-query-digest /var/log/mysql/mariadb-slow.log > ~/log/$(date +mysql-slow.log-%m-%d-%H-%M -d "+9 hours")
sudo rm /var/log/mysql/mariadb-slow.log
sudo systemctl restart mysql
cd ~/log && cat $(ls -t mysql-slow.log-* | head -n 1) # 最新のログを表示
```

:::details `~/log && cat $(ls -t mysql-slow.log-* | head -n 1)` 出力結果
```
# 34.2s user time, 140ms system time, 35.25M rss, 42.46M vsz
# Current date: Fri Nov 15 18:19:46 2024
# Hostname: ip-192-168-0-11
# Files: /var/log/mysql/mariadb-slow.log
# Overall: 409.97k total, 96 unique, 4.88k QPS, 2.44x concurrency ________
# Time range: 2024-11-15 18:12:08 to 18:13:32
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time           205s       0   180ms   499us     2ms     3ms    20us
# Lock time             3s       0    19ms     7us    12us   151us       0
# Rows sent          5.88M       0   1.70k   15.04    0.99  108.94       0
# Rows examine      14.04M       0   3.39k   35.92    0.99  228.01       0
# Rows affecte      73.97k       0     618    0.18    0.99    1.00       0
# Bytes sent         1.47G       0 269.10k   3.77k   8.46k  20.59k   12.54
# Query size        34.44M       6 790.36k   88.09  258.32   1.32k   31.70
# Boolean:
# QC hit         8% yes,  91% no

# Profile
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0x931A992E852C61FC6D46141A39DEF4FE  60.1767 29.4%  12273 0.0049  0.01 SELECT isu_condition
#    2 0xFFFCA4D67EA0A788813031B8BBC3B329  46.1545 22.5%   9098 0.0051  0.01 COMMIT
#    3 0x9C6C682008AE0D08F3E2A0049B030C70  27.3103 13.3%   2855 0.0096  0.01 SELECT isu_condition
#    4 0x8155B89FFD74A9D523D19AC409FD97AF  24.9873 12.2%   4512 0.0055  0.01 SELECT isu_condition
#    5 0xB8B32624C3268C0925657C305C0ED778  19.0628  9.3%  74961 0.0003  0.00 INSERT isu_condition
#    6 0xDA556F9115773A1A99AA0165670CE848  13.7307  6.7% 130387 0.0001  0.00 ADMIN PREPARE
#    7 0x5F580A12ADA1633C9634298BE5BD9422   6.5526  3.2%    735 0.0089  0.01 SELECT isu_condition
# MISC 0xMISC                               6.8486  3.3% 175153 0.0000   0.0 <89 ITEMS>

# Query 1: 201.20 QPS, 0.99x concurrency, ID 0x931A992E852C61FC6D46141A39DEF4FE at byte 122018329
# Scores: V/M = 0.01
# Time range: 2024-11-15 18:12:31 to 18:13:32
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          2   12273
# Exec time     29     60s     6us    96ms     5ms    21ms     8ms     2ms
# Lock time     16   544ms       0    19ms    44us    36us   410us     8us
# Rows sent     66   3.89M       0   1.70k  332.60   1.20k  414.35   97.36
# Rows examine  53   7.47M       0   3.39k  638.34   2.38k  804.14  174.84
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    40 604.78M     589 269.10k  50.46k 192.13k  62.71k  14.47k
# Query size     3   1.35M     115     115     115     115       0     115
# Boolean:
# QC hit         3% yes,  96% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  #########
# 100us  #######################################################
#   1ms  ################################################################
#  10ms  #######################
# 100ms  #
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G        
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'e9acc7bf-883b-42c6-8f2a-6a33f0c1b55a' ORDER BY timestamp DESC\G

# Query 2: 149.15 QPS, 0.76x concurrency, ID 0xFFFCA4D67EA0A788813031B8BBC3B329 at byte 129341043
# Scores: V/M = 0.01
# Time range: 2024-11-15 18:12:30 to 18:13:31
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          2    9098
# Exec time     22     46s     2us   180ms     5ms    12ms     8ms     4ms
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0  97.73k      11      11      11      11       0      11
# Query size     0  53.31k       6       6       6       6       0       6
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #####
#  10us  ###
# 100us  ###
#   1ms  ################################################################
#  10ms  ########
# 100ms  #
#    1s
#  10s+
COMMIT\G

# Query 3: 46.80 QPS, 0.45x concurrency, ID 0x9C6C682008AE0D08F3E2A0049B030C70 at byte 128535641
# Scores: V/M = 0.01
# Time range: 2024-11-15 18:12:30 to 18:13:31
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0    2855
# Exec time     13     27s   100us    75ms    10ms    31ms    10ms     6ms
# Lock time      5   181ms     5us    15ms    63us    33us   580us     9us
# Rows sent     24   1.45M       0   1.55k  534.30   1.09k  340.38  487.09
# Rows examine  23   3.33M       0   3.10k   1.19k   2.38k  721.14   1.09k
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    14 223.91M     589 248.44k  80.31k 174.27k  51.20k  72.41k
# Query size     1 437.73k     157     157     157     157       0     157
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us
# 100us  ##########
#   1ms  ################################################################
#  10ms  ####################################
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G        
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '9b636b32-5bd0-4b3f-8c04-333253c23e06'    AND `timestamp` < '2021-08-27 11:12:28'        ORDER BY `timestamp` DESC\G

# Query 4: 73.97 QPS, 0.41x concurrency, ID 0x8155B89FFD74A9D523D19AC409FD97AF at byte 135042924
# Scores: V/M = 0.01
# Time range: 2024-11-15 18:12:30 to 18:13:31
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          1    4512
# Exec time     12     25s    39us    81ms     6ms    21ms     8ms     2ms
# Lock time      8   285ms     4us    17ms    63us    33us   593us     7us
# Rows sent      0   4.33k       0       1    0.98    0.99    0.13    0.99
# Rows examine  15   2.16M       0   1.69k  501.11   1.20k  370.45  400.73
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0   3.18M     589     789  739.67  755.64   24.19  719.66
# Query size     1 550.78k     125     125     125     125       0     125
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  ##
# 100us  ##################################
#   1ms  ################################################################
#  10ms  ######################
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G        
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '03a23aca-9f46-4b3e-be5b-190389429455' ORDER BY `timestamp` DESC LIMIT 1\G
```
:::

1位抜粋
```
# Query 1: 201.20 QPS, 0.99x concurrency, ID 0x931A992E852C61FC6D46141A39DEF4FE at byte 122018329
# Scores: V/M = 0.01
# Time range: 2024-11-15 18:12:31 to 18:13:32
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          2   12273
# Exec time     29     60s     6us    96ms     5ms    21ms     8ms     2ms
# Lock time     16   544ms       0    19ms    44us    36us   410us     8us
# Rows sent     66   3.89M       0   1.70k  332.60   1.20k  414.35   97.36
# Rows examine  53   7.47M       0   3.39k  638.34   2.38k  804.14  174.84
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    40 604.78M     589 269.10k  50.46k 192.13k  62.71k  14.47k
# Query size     3   1.35M     115     115     115     115       0     115
# Boolean:
# QC hit         3% yes,  96% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  #########
# 100us  #######################################################
#   1ms  ################################################################
#  10ms  #######################
# 100ms  #
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G        
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'e9acc7bf-883b-42c6-8f2a-6a33f0c1b55a' ORDER BY timestamp DESC\G
```

おや？先ほどと同じクエリがまだ1位のようです。情報を見ていきましょう。  
9354万行も走査していたのが、747万行の査定に減っています。`Rows examine`が減っているので、`Index`が効いていることが分かります。  
実際、先ほどは1回のクエリ当たり平均 34 msだったのが、今回は 5 msになっています。7倍の高速化に成功していますね！  
しかし、まだボトルネックとなっているので、改善したいですね。先ほどと同じように解析していきます。  

```
MariaDB [isucondition]> explain SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'e9acc7bf-883b-42c6-8f2a-6a33f0c1b55a' ORDER BY timestamp DESC\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: isu_condition
         type: ref
possible_keys: jia_isu_uuid_index
          key: jia_isu_uuid_index
      key_len: 144
          ref: const
         rows: 1542
        Extra: Using index condition; Using where; Using filesort
1 row in set (0.000 sec)
```
`key`の行には、`jia_isu_uuid_index`があり、先ほど追加した`Index`が使われていることが分かります。今回注目したいのは`Using filesort`です。  
`Using filesort`は、`ORDER BY`句で指定されたカラムに対して、ソートを行うために、ファイルソートを行っていることを示しています。  
ファイルソートは、`MySQL`の内部でソートを行うために、ディスクに一時ファイルを作成して、そのファイルをソートする処理を行っていることを示しています。  
つまり、ディスクI/Oが発生するため、遅い処理になります。`ORDER BY`句で指定されたカラムに対しても`Index`を貼ることで、`Using filesort`を回避できそうです。  
ここで、複合インデックスというものを使うと、`jia_isu_uuid`と`timestamp`の両方に対して`Index`を貼ることができ、`WHERE`句と`ORDER BY`句の両方で高速化できます。  
複合インデックスを貼るためには、以下の`SQL`を`webapp/sql/0_Schema.sql`に追加しましょう。
```sql
ALTER TABLE isu_condition ADD INDEX jia_isu_uuid_timestamp_index (jia_isu_uuid, timestamp);
```
```shell
# 自分のPC上で webapp/sql/0_Schema.sql を編集した後、自分のPC上で以下のコマンド
git add webapp/sql/0_Schema.sql
git commit -m ":zap: isu_condition の jia_isu_uuid と timestamp に 複合INDEX を追加"
git push origin main

# ISUCONサーバー側で
git pull

# ベンチマーク実行
18:50:20.618884 score: 20824(20826 - 2) : pass
18:50:20.618895 deduction: 0 / timeout: 21
```

少しスコアが伸びましたが、思っているより伸びませんでした。計測してみてみましょう。  

```shell
sudo pt-query-digest /var/log/mysql/mariadb-slow.log > ~/log/$(date +mysql-slow.log-%m-%d-%H-%M -d "+9 hours")
sudo rm /var/log/mysql/mariadb-slow.log
sudo systemctl restart mysql
cd ~/log && cat $(ls -t mysql-slow.log-* | head -n 1)
```
```
# 36.6s user time, 190ms system time, 35.79M rss, 43.05M vsz
# Current date: Fri Nov 15 19:08:12 2024
# Hostname: ip-192-168-0-11
# Files: /var/log/mysql/mariadb-slow.log
# Overall: 439.92k total, 96 unique, 4.94k QPS, 1.45x concurrency ________
# Time range: 2024-11-15 18:48:51 to 18:50:20
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time           129s       0    81ms   293us     1ms     1ms    19us
# Lock time             3s       0    18ms     6us    13us   118us       0
# Rows sent          7.59M       0   1.74k   18.10    4.96  119.47       0
# Rows examine       7.54M       0   1.74k   17.97    0.99  119.43       0
# Rows affecte      73.61k       0     618    0.17    0.99    0.97       0
# Bytes sent         1.87G       0 268.25k   4.47k  15.20k  22.21k   12.54
# Query size        35.73M       6 790.36k   85.16  258.32   1.28k   31.70
# Boolean:
# QC hit         8% yes,  91% no

# Profile
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0x931A992E852C61FC6D46141A39DEF4FE  43.5059 33.7%  16431 0.0026  0.01 SELECT isu_condition
#    2 0xFFFCA4D67EA0A788813031B8BBC3B329  36.4300 28.2%   9298 0.0039  0.00 COMMIT
#    3 0xB8B32624C3268C0925657C305C0ED778  14.3355 11.1%  74590 0.0002  0.00 INSERT isu_condition
#    4 0x9C6C682008AE0D08F3E2A0049B030C70  13.1944 10.2%   3246 0.0041  0.00 SELECT isu_condition
#    5 0xDA556F9115773A1A99AA0165670CE848  12.3725  9.6% 140228 0.0001  0.00 ADMIN PREPARE
#    6 0x5F580A12ADA1633C9634298BE5BD9422   3.1293  2.4%    854 0.0037  0.00 SELECT isu_condition
# MISC 0xMISC                               6.1706  4.8% 195274 0.0000   0.0 <90 ITEMS>

# Query 1: 273.85 QPS, 0.73x concurrency, ID 0x931A992E852C61FC6D46141A39DEF4FE at byte 136761106
# Scores: V/M = 0.01
# Time range: 2024-11-15 18:49:20 to 18:50:20
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          3   16431
# Exec time     33     44s     5us    77ms     3ms    11ms     4ms     1ms
# Lock time     19   563ms       0    16ms    34us    30us   323us     8us
# Rows sent     67   5.10M       0   1.74k  325.40   1.20k  400.66   97.36
# Rows examine  67   5.09M       0   1.74k  324.68   1.20k  400.73   97.36
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    40 783.90M     589 268.25k  48.85k 182.98k  59.81k  14.47k
# Query size     5   1.80M     115     115     115     115       0     115
# Boolean:
# QC hit         1% yes,  98% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  #############
# 100us  ######################################################
#   1ms  ################################################################
#  10ms  ########
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'f1088bda-bd87-4871-81b6-636fc85d36c9' ORDER BY timestamp DESC\G

# Query 2: 152.43 QPS, 0.60x concurrency, ID 0xFFFCA4D67EA0A788813031B8BBC3B329 at byte 33691990
# Scores: V/M = 0.00
# Time range: 2024-11-15 18:49:19 to 18:50:20
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          2    9298
# Exec time     28     36s     2us    65ms     4ms    10ms     3ms     3ms
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0  99.88k      11      11      11      11       0      11
# Query size     0  54.48k       6       6       6       6       0       6
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  ######
#  10us  ####
# 100us  ###
#   1ms  ################################################################
#  10ms  ####
# 100ms
#    1s
#  10s+
COMMIT\G
```
```
MariaDB [isucondition]> explain SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'f1088bda-bd87-4871-81b6-636fc85d36c9' ORDER BY timestamp DESC\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: isu_condition
         type: ref
possible_keys: jia_isu_uuid_timestamp_index
          key: jia_isu_uuid_timestamp_index
      key_len: 144
          ref: const
         rows: 1304
        Extra: Using where
1 row in set (0.001 sec)
```
Extraに`Using filesort`がなくなりました。`ORDER BY`句で指定されたカラムに対しても`Index`を貼ることで、`Using filesort`を回避できていることが分かります。  
また、`Rows examine`がさらに減っているので、`Index`が効いていることが分かります。`Rows examine`と`Rows sent`がほとんど同じ値になっていて効率的に探索できていますね。  
探索は効率良く出来ているのにも関わらず、ボトルネックとなっている原因は、`Calls`が多いためですね。`Calls`が多いということは、同じクエリが何度も実行されているということです。  
アプリケーション側で、1回で一気に取れるデータをループ処理で何回も取得しているなど、効率の悪い処理が行われている可能性があります。  
というわけで、ボトルネックがアプリケーション側にある可能性が高いので、次の章でアプリケーション側の計測を行ってみましょう！

---

以下補足...

`ADMIN PREPARE`というクエリが、`12.3725`秒かかっているのが分かります。  
これは何かというと、クエリを実行する際に、クエリを解析して、実行計画を立てる処理です。これによってSQLインジェクションを防げます。  
しかし、`Calls`を見ると、`176569`ととんでもない数が呼び出されていることが分かります。  
これは各クエリの実行時に毎回クエリを解析して、実行計画を立てていることを意味しています。  
正しい使い方をすれば、毎回のクエリでは呼ばずに最初の一回だけ実行すれば良いのですが、初期の実装では毎回実行するという実装のようです。
:::tip ADMIN PREPARE を無効化する
これは以下の様に`&interpolateParams=true`というパラメータを追加することで、`ADMIN PREPARE`を行わないようにできます。  
これはアプリケーション側で、文字列を結合して`MySQL`サーバーに送るということをするパラメーターです。  
毎回クエリの解析を行わないようにする分多少の改善は見込めますが、基本的には`MySQL`側でやっていたことをアプリケーション側でやるだけなので、ちょっとした改善程度になります。  
ちなみに、実際に開発するときは、これによって`SQLインジェクション`の脆弱性が生まれるので、やらないようにしましょう。
https://github.com/pikachu0310/isucon-workshop-2023/commit/953cfb75069903f9b4e5882337c317eb249bd7cd  
参考:  
[MySQL :: MySQL 8.0 リファレンスマニュアル :: 13.5 プリペアドステートメント](https://dev.mysql.com/doc/refman/8.0/ja/sql-prepared-statements.html)  
[go-sql-driver#interpolateparams](https://github.com/go-sql-driver/mysql#interpolateparams)
:::

## 計測すると...？
ベンチマークの実行中に`htop`を見てみると、データーベースよりもアプリケーションの方が圧倒的にボトルネックになっていそうです。なので、データーベースの改善は一旦終わりにして、アプリケーションの改善に移りましょう。  
アプリケーションの改善に移るために、次のアクセスログの章でアクセスログを解析してみましょう！
