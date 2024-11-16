# 計測、ボトルネックの発見、改善！

## 計測
まずは今までの情報をまとめましょう。

ベンチマークを回す前にログローテーション&再起動
```shell
sudo rm /var/log/mysql/mariadb-slow.log
sudo systemctl restart mysql

sudo rm /var/log/nginx/access.log
sudo systemctl restart nginx

cd ~/webapp/go
go build -o isucondition main.go
sudo systemctl restart isucondition.go.service
```

ベンチマーク後(中)の各種計測コマンド
```shell
sudo pt-query-digest /var/log/mysql/mariadb-slow.log > ~/log/$(date +mysql-slow.log-%m-%d-%H-%M -d "+9 hours")
cd ~/log && cat $(ls -t mysql-slow.log-* | head -n 1)

sudo cat /var/log/nginx/access.log | alp ltsv -m"/api/isu/[a-f0-9\-]+","/api/isu/[a-f0-9\-]+/icon","/api/condition/[a-f0-9\-]+","/isu/[a-f0-9\-]+","/isu/[a-f0-9\-]+/graph","/isu/[a-f0-9\-]+/condition","/assets.*" --sort sum -r > ~/log/$(date +access.log-%m-%d-%H-%M -d "+9 hours")
cd ~/log && cat $(ls -t access.log-* | head -n 1)

go tool pprof http://localhost:6060/debug/pprof/profile?seconds=60
go tool pprof -http=localhost:6070 "$(ls -v /home/isucon/pprof/pprof.isucondition.samples.cpu.*.pb.gz | tail -n 1)"
```

複合INDEXを張る改善をした後の計測結果
```
# 37.1s user time, 160ms system time, 36.27M rss, 43.52M vsz
# Current date: Sat Nov 16 18:09:29 2024
# Hostname: ip-192-168-0-12
# Files: /var/log/mysql/mariadb-slow.log
# Overall: 437.77k total, 96 unique, 4.56k QPS, 1.40x concurrency ________
# Time range: 2024-11-16 17:58:03 to 17:59:39
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time           134s       0   208ms   307us     1ms     1ms    19us
# Lock time             3s       0    23ms     6us    13us   108us       0
# Rows sent          7.56M       0   1.58k   18.12    3.89  118.99       0
# Rows examine       7.45M       0   1.58k   17.85    0.99  118.15       0
# Rows affecte      72.13k       0     618    0.17    0.99    0.97       0
# Bytes sent         1.89G       0 263.86k   4.53k  16.75k  22.15k   12.54
# Query size        35.49M       6 790.36k   85.01  258.32   1.28k   31.70
# Boolean:
# QC hit         8% yes,  91% no

# Profile
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0x931A992E852C61FC6D46141A39DEF4FE  44.3574 33.0%  15928 0.0028  0.01 SELECT isu_condition     
#    2 0xFFFCA4D67EA0A788813031B8BBC3B329  39.4337 29.3%   9213 0.0043  0.00 COMMIT
#    3 0xB8B32624C3268C0925657C305C0ED778  14.8722 11.1%  73074 0.0002  0.00 INSERT isu_condition     
#    4 0x9C6C682008AE0D08F3E2A0049B030C70  14.1167 10.5%   3253 0.0043  0.01 SELECT isu_condition     
#    5 0xDA556F9115773A1A99AA0165670CE848  12.1349  9.0% 139535 0.0001  0.00 ADMIN PREPARE
#    6 0x5F580A12ADA1633C9634298BE5BD9422   2.8154  2.1%    864 0.0033  0.00 SELECT isu_condition     
#    7 0x8155B89FFD74A9D523D19AC409FD97AF   1.7196  1.3%   5672 0.0003  0.00 SELECT isu_condition     
# MISC 0xMISC                               5.0350  3.7% 190227 0.0000   0.0 <89 ITEMS>

# Query 1: 261.11 QPS, 0.73x concurrency, ID 0x931A992E852C61FC6D46141A39DEF4FE at byte 118952938     
# Scores: V/M = 0.01
# Time range: 2024-11-16 17:58:38 to 17:59:39
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          3   15928
# Exec time     32     44s     6us    48ms     3ms    11ms     4ms     1ms
# Lock time     18   496ms       0    10ms    31us    28us   251us     7us
# Rows sent     67   5.09M       0   1.58k  335.35   1.20k  402.48  124.25
# Rows examine  67   5.02M       0   1.58k  330.74   1.14k  398.99  118.34
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    40 783.86M     589 263.86k  50.39k 182.98k  60.22k  18.47k
# Query size     4   1.75M     115     115     115     115       0     115
# Boolean:
# QC hit         1% yes,  98% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  ###########
# 100us  ####################################################
#   1ms  ################################################################
#  10ms  ########
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'c6f1db09-ee79-409c-9e6c-b055564cf7c4' ORDER BY timestamp DESC\G

# Query 2: 151.03 QPS, 0.65x concurrency, ID 0xFFFCA4D67EA0A788813031B8BBC3B329 at byte 81492095      
# Scores: V/M = 0.00
# Time range: 2024-11-16 17:58:38 to 17:59:39
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          2    9213
# Exec time     29     39s     2us   208ms     4ms    10ms     4ms     4ms
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0  98.97k      11      11      11      11       0      11
# Query size     0  53.98k       6       6       6       6       0       6
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #######
#  10us  ####
# 100us  ###
#   1ms  ################################################################
#  10ms  ####
# 100ms  #
#    1s
#  10s+
COMMIT\G

# Query 3: 1.22k QPS, 0.25x concurrency, ID 0xB8B32624C3268C0925657C305C0ED778 at byte 128235531      
# Scores: V/M = 0.00
# Time range: 2024-11-16 17:58:39 to 17:59:39
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         16   73074
# Exec time     11     15s    13us    24ms   203us   761us   823us    38us
# Lock time     64      2s     3us    14ms    23us    28us   179us     8us
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte  98  71.36k       1       1       1       1       0       1
# Bytes sent     0 935.66k      13      14   13.11   13.83    0.40   12.54
# Query size    50  17.80M     233     302  255.36  271.23   12.29  246.02
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  #######
#   1ms  ###
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
INSERT INTO `isu_condition`     (`jia_isu_uuid`, `timestamp`, `is_sitting`, `condition`, `message`)  VALUES ('e4c57c95-dd23-4fa0-bb80-4637baac2bf0', '2021-08-28 01:21:29', 1, 'is_dirty=true,is_overweight=false,is_broken=false', 'キレイにして...')\G

# Query 4: 53.33 QPS, 0.23x concurrency, ID 0x9C6C682008AE0D08F3E2A0049B030C70 at byte 122378320      
# Scores: V/M = 0.01
# Time range: 2024-11-16 17:58:38 to 17:59:39
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0    3253
# Exec time     10     14s    51us    52ms     4ms    14ms     5ms     3ms
# Lock time      4   117ms     5us    23ms    36us    36us   459us     8us
# Rows sent     24   1.83M       0   1.53k  589.36   1.14k  362.13  537.02
# Rows examine  24   1.83M       0   1.53k  589.36   1.14k  362.13  537.02
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    14 279.61M     589 261.21k  88.02k 182.98k  54.32k  79.83k
# Query size     1 498.75k     157     157     157     157       0     157
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  #
# 100us  ################
#   1ms  ################################################################
#  10ms  ##########
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '06800476-b2e0-4649-b844-bddec542b763'     AND `timestamp` < '2021-08-22 22:36:11'       ORDER BY `timestamp` DESC\G

# Query 5: 2.11k QPS, 0.18x concurrency, ID 0xDA556F9115773A1A99AA0165670CE848 at byte 137925503      
# Scores: V/M = 0.00
# Time range: 2024-11-16 17:58:33 to 17:59:39
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         31  139535
# Exec time      9     12s    10us    50ms    86us   236us   404us    28us
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     1  34.01M      52     681  255.61  621.67  200.20  158.58
# Query size    11   3.99M      30      30      30      30       0      30
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  #####
#   1ms  #
#  10ms  #
# 100ms
#    1s
#  10s+
administrator command: Prepare\G

# Query 6: 14.40 QPS, 0.05x concurrency, ID 0x5F580A12ADA1633C9634298BE5BD9422 at byte 131367119      
# Scores: V/M = 0.00
# Time range: 2024-11-16 17:58:38 to 17:59:38
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0     864
# Exec time      2      3s     9us    36ms     3ms    10ms     4ms     2ms
# Lock time      1    46ms       0    11ms    53us    28us   514us     7us
# Rows sent      7 590.17k       6   1.54k  699.46   1.33k  408.09  652.75
# Rows examine   7 588.58k       0   1.54k  697.57   1.33k  409.18  652.75
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     4  88.35M   1.48k 261.21k 104.71k 201.74k  61.16k 101.89k
# Query size     0  97.88k     116     116     116     116       0     116
# Boolean:
# QC hit         0% yes,  99% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  #
# 100us  ####################
#   1ms  ################################################################
#  10ms  #####
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '299d8a9b-ae82-4789-9fae-3266542d8160' ORDER BY `timestamp` ASC\G

# Query 7: 94.53 QPS, 0.03x concurrency, ID 0x8155B89FFD74A9D523D19AC409FD97AF at byte 117574013      
# Scores: V/M = 0.00
# Time range: 2024-11-16 17:58:38 to 17:59:38
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          1    5672
# Exec time      1      2s    34us    17ms   303us     1ms   857us    76us
# Lock time      5   156ms     3us     9ms    27us    26us   220us     7us
# Rows sent      0   5.47k       0       1    0.99    0.99    0.11    0.99
# Rows examine   0   5.47k       0       1    0.99    0.99    0.11    0.99
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0   4.00M     589     789  739.71  755.64   21.01  719.66
# Query size     1 692.38k     125     125     125     125       0     125
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  #########################
#   1ms  ######
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '053a8991-b0f2-4c23-8336-025b349be9e5' ORDER BY `timestamp` DESC LIMIT 1\G
```

```
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+-----------+
| COUNT | 1XX |  2XX  | 3XX | 4XX | 5XX | METHOD |            URI             |  MIN  |  MAX  |   SUM   |  AVG  |  P90  |  P95  |  P99  | STDDEV | MIN(BODY) | MAX(BODY)  |   SUM(BODY)   | AVG(BODY) |
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+-----------+
| 74401 | 0   | 73763 | 0   | 638 | 0   | POST   | /api/condition/[a-f0-9\-]+ | 0.012 | 0.260 | 550.121 | 0.007 | 0.020 | 0.052 | 0.092 | 0.018  | 0.000     | 14.000     | 84.000        | 0.001     |
| 8988  | 0   | 8371  | 0   | 617 | 0   | GET    | /api/isu/[a-f0-9\-]+       | 0.004 | 0.516 | 303.594 | 0.034 | 0.064 | 0.088 | 0.136 | 0.028  | 0.000     | 135421.000 | 184479057.000 | 20525.040 |
| 207   | 0   | 19    | 0   | 188 | 0   | GET    | /api/trend                 | 0.020 | 1.012 | 197.143 | 0.952 | 1.004 | 1.008 | 1.008 | 0.192  | 0.000     | 8223.000   | 116095.000    | 560.845   |
| 3940  | 0   | 3542  | 0   | 398 | 0   | GET    | /api/condition/[a-f0-9\-]+ | 0.004 | 0.536 | 192.482 | 0.049 | 0.092 | 0.112 | 0.192 | 0.038  | 0.000     | 7142.000   | 20225519.000  | 5133.380  |
| 985   | 0   | 929   | 0   | 56  | 0   | GET    | /api/isu                   | 0.004 | 0.344 | 51.072  | 0.052 | 0.084 | 0.112 | 0.172 | 0.035  | 3.000     | 4637.000   | 2840562.000   | 2883.819  |
| 798   | 0   | 350   | 0   | 448 | 0   | POST   | /api/auth                  | 0.004 | 0.116 | 7.596   | 0.010 | 0.024 | 0.036 | 0.064 | 0.014  | 0.000     | 19.000     | 5152.000      | 6.456     |
| 1710  | 0   | 1230  | 480 | 0   | 0   | GET    | /assets.*                  | 0.000 | 0.216 | 4.080   | 0.002 | 0.004 | 0.008 | 0.012 | 0.006  | 592.000   | 743417.000 | 163241879.000 | 95463.087 |
| 55    | 0   | 51    | 0   | 4   | 0   | POST   | /api/isu                   | 0.004 | 0.124 | 3.832   | 0.070 | 0.092 | 0.120 | 0.124 | 0.024  | 15.000    | 148.000    | 7043.000      | 128.055   |
| 410   | 0   | 182   | 0   | 228 | 0   | GET    | /api/user/me               | 0.056 | 0.084 | 3.256   | 0.008 | 0.020 | 0.032 | 0.064 | 0.013  | 21.000    | 44.000     | 11814.000     | 28.815    |
| 232   | 0   | 174   | 0   | 58  | 0   | POST   | /api/signout               | 0.020 | 0.072 | 2.812   | 0.012 | 0.028 | 0.040 | 0.060 | 0.014  | 0.000     | 21.000     | 1218.000      | 5.250     |
| 451   | 0   | 388   | 63  | 0   | 0   | GET    | /                          | 0.000 | 0.020 | 0.768   | 0.002 | 0.004 | 0.008 | 0.016 | 0.003  | 528.000   | 528.000    | 204864.000    | 454.244   |
| 1     | 0   | 1     | 0   | 0   | 0   | POST   | /initialize                | 0.356 | 0.356 | 0.356   | 0.356 | 0.356 | 0.356 | 0.356 | 0.000  | 23.000    | 23.000     | 23.000        | 23.000    |
| 30    | 0   | 18    | 12  | 0   | 0   | GET    | /isu/[a-f0-9\-]+           | 0.000 | 0.004 | 0.012   | 0.000 | 0.000 | 0.004 | 0.004 | 0.001  | 0.000     | 528.000    | 9504.000      | 316.800   |
| 3     | 0   | 1     | 2   | 0   | 0   | GET    | /register                  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 0.000     | 528.000    | 528.000       | 176.000   |
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+-----------+
```

![](3-img/img_2.png)

```go
// GET /api/trend
// ISUの性格毎の最新のコンディション情報
func getTrend(c echo.Context) error {
	characterList := []Isu{}
	err := db.Select(&characterList, "SELECT `character` FROM `isu` GROUP BY `character`")
	if err != nil {
		c.Logger().Errorf("db error: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	res := []TrendResponse{}

	for _, character := range characterList {
		isuList := []Isu{}
		err = db.Select(&isuList,
			"SELECT * FROM `isu` WHERE `character` = ?",
			character.Character,
		)
		if err != nil {
			c.Logger().Errorf("db error: %v", err)
			return c.NoContent(http.StatusInternalServerError)
		}

		characterInfoIsuConditions := []*TrendCondition{}
		characterWarningIsuConditions := []*TrendCondition{}
		characterCriticalIsuConditions := []*TrendCondition{}
		for _, isu := range isuList {
			conditions := []IsuCondition{}
			err = db.Select(&conditions,
				"SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = ? ORDER BY timestamp DESC",
				isu.JIAIsuUUID,
			)
			if err != nil {
				c.Logger().Errorf("db error: %v", err)
				return c.NoContent(http.StatusInternalServerError)
			}

			if len(conditions) > 0 {
				isuLastCondition := conditions[0]
				conditionLevel, err := calculateConditionLevel(isuLastCondition.Condition)
				if err != nil {
					c.Logger().Error(err)
					return c.NoContent(http.StatusInternalServerError)
				}
				trendCondition := TrendCondition{
					ID:        isu.ID,
					Timestamp: isuLastCondition.Timestamp.Unix(),
				}
				switch conditionLevel {
				case "info":
					characterInfoIsuConditions = append(characterInfoIsuConditions, &trendCondition)
				case "warning":
					characterWarningIsuConditions = append(characterWarningIsuConditions, &trendCondition)
				case "critical":
					characterCriticalIsuConditions = append(characterCriticalIsuConditions, &trendCondition)
				}
			}

		}

		sort.Slice(characterInfoIsuConditions, func(i, j int) bool {
			return characterInfoIsuConditions[i].Timestamp > characterInfoIsuConditions[j].Timestamp
		})
		sort.Slice(characterWarningIsuConditions, func(i, j int) bool {
			return characterWarningIsuConditions[i].Timestamp > characterWarningIsuConditions[j].Timestamp
		})
		sort.Slice(characterCriticalIsuConditions, func(i, j int) bool {
			return characterCriticalIsuConditions[i].Timestamp > characterCriticalIsuConditions[j].Timestamp
		})
		res = append(res,
			TrendResponse{
				Character: character.Character,
				Info:      characterInfoIsuConditions,
				Warning:   characterWarningIsuConditions,
				Critical:  characterCriticalIsuConditions,
			})
	}

	return c.JSON(http.StatusOK, res)
}
```
実装を見ると、`isu` テーブルから `character` を取得し、その `character` に対応する `isu` を取得し、さらにその `isu` に対応する `isu_condition` を取得しています。  
N+1問題が発生しているのが明確なのですが、今回は `isu_condition` の取得がボトルネックとなっている事を思い出して周辺の実装を見てみると、
```go
isuLastCondition := conditions[0]
```
となっているので、`isu_condition` の取得は最新の1件だけで良さそうですが、"SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = ? ORDER BY timestamp DESC" として全件取得していることが分かります。  
最新の1件だけ取るように修正することで、高速化が期待できます。以下のように LIMIT 1 を追加します。
```go
err = db.Get(&isuLastCondition,
    "SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = ? ORDER BY timestamp DESC LIMIT 1", // LIMIT 1 を追加
    isu.JIAIsuUUID,
)
```
再度計測してみましょう！
