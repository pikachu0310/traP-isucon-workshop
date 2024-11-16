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
:::details スロークエリログ全文
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
:::
```
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
そして、なんとこのクエリはスロークエリログの1位と一致しています！これこそがボトルネックそうです！  
今回は、最新の1件だけ取るように修正することで高速化が期待できます。以下のように LIMIT 1 を追加します。  
```go
err = db.Get(&isuLastCondition,
    "SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = ? ORDER BY timestamp DESC LIMIT 1", // LIMIT 1 を追加
    isu.JIAIsuUUID,
)
```

再度ベンチマークを回して、計測しましょう！  
```
18:33:09.894377 score: 26328(26330 - 2) : pass
18:33:09.894388 deduction: 0 / timeout: 22
```
スコアが伸びました！やった！改善されたのかな？  
計測結果を見ましょう！！！  

:::details スロークエリログ全文
```
isucon@ip-192-168-0-12:~/log$ cd ~/log && cat $(ls -t mysql-slow.log-* | head -n 1)

# 46.7s user time, 330ms system time, 35.31M rss, 42.45M vsz
# Current date: Sat Nov 16 18:38:04 2024
# Hostname: ip-192-168-0-12
# Files: /var/log/mysql/mariadb-slow.log
# Overall: 561.93k total, 96 unique, 5.02k QPS, 1.05x concurrency ________
# Time range: 2024-11-16 18:31:41 to 18:33:33
# Attribute          total     min     max     avg     95%  stddev  median
# ============     ======= ======= ======= ======= ======= ======= =======
# Exec time           118s       0   110ms   209us   690us     1ms    20us
# Lock time             4s       0    23ms     6us    12us   106us       0
# Rows sent          3.57M       0   1.60k    6.67    0.99   75.43       0
# Rows examine       3.49M       0   1.60k    6.52    0.99   75.42       0
# Rows affecte      73.89k       0     618    0.13    0.99    0.86       0
# Bytes sent         1.84G       0 270.33k   3.43k   6.63k  18.98k   69.19
# Query size        42.13M       6 790.36k   78.61  246.02   1.13k   31.70
# Boolean:
# QC hit        10% yes,  89% no

# Profile
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0xFFFCA4D67EA0A788813031B8BBC3B329  37.6853 32.0%  10285 0.0037  0.00 COMMIT
#    2 0x9C6C682008AE0D08F3E2A0049B030C70  20.0148 17.0%   4151 0.0048  0.01 SELECT isu_condition
#    3 0xDA556F9115773A1A99AA0165670CE848  18.4219 15.6% 180079 0.0001  0.00 ADMIN PREPARE
#    4 0xAC9E2250E1642BFE9823A9B9ECA1A419  14.4006 12.2%  28162 0.0005  0.00 SELECT isu_condition
#    5 0xB8B32624C3268C0925657C305C0ED778  13.3736 11.3%  74874 0.0002  0.00 INSERT isu_condition
#    6 0x5F580A12ADA1633C9634298BE5BD9422   4.1966  3.6%   1085 0.0039  0.00 SELECT isu_condition
#    7 0x8155B89FFD74A9D523D19AC409FD97AF   2.6373  2.2%  10190 0.0003  0.00 SELECT isu_condition
#    8 0x8C2BC651CBBBF3DB41D1CAD61AA0BD68   1.2800  1.1%   9050 0.0001  0.00 SELECT isu
#    9 0xADCA4F127A769A45A2D1B74705103105   1.1349  1.0%  22448 0.0001  0.00 SELECT user
# MISC 0xMISC                               4.8045  4.1% 221609 0.0000   0.0 <87 ITEMS>

# Query 1: 171.42 QPS, 0.63x concurrency, ID 0xFFFCA4D67EA0A788813031B8BBC3B329 at byte 38148973
# Scores: V/M = 0.00
# Time range: 2024-11-16 18:32:09 to 18:33:09
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          1   10285
# Exec time     31     38s     2us    72ms     4ms     9ms     4ms     3ms
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0 110.48k      11      11      11      11       0      11
# Query size     0  60.26k       6       6       6       6       0       6
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  ############
#  10us  #####
# 100us  ###
#   1ms  ################################################################
#  10ms  ###
# 100ms
#    1s
#  10s+
COMMIT\G

# Query 2: 69.18 QPS, 0.33x concurrency, ID 0x9C6C682008AE0D08F3E2A0049B030C70 at byte 87542454
# Scores: V/M = 0.01
# Time range: 2024-11-16 18:32:09 to 18:33:09
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0    4151
# Exec time     16     20s    55us    42ms     5ms    15ms     5ms     3ms
# Lock time      4   151ms     4us    10ms    36us    54us   253us     8us
# Rows sent     75   2.69M       0   1.59k  679.50   1.26k  397.89  652.75
# Rows examine  77   2.69M       0   1.59k  679.50   1.26k  397.89  652.75
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    21 401.54M     589 232.99k  99.05k 192.13k  57.73k  97.04k
# Query size     1 636.43k     157     157     157     157       0     157
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  #
# 100us  ###############
#   1ms  ################################################################
#  10ms  ############
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = 'badb352e-185b-4b06-94f5-7a4e9c858d37'     AND `timestamp` < '2021-08-19 00:30:16' ORDER BY `timestamp` DESC\G

# Query 3: 2.02k QPS, 0.21x concurrency, ID 0xDA556F9115773A1A99AA0165670CE848 at byte 22809180
# Scores: V/M = 0.00
# Time range: 2024-11-16 18:32:04 to 18:33:33
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         32  180079
# Exec time     15     18s    10us    35ms   102us   348us   404us    28us
# Lock time      0       0       0       0       0       0       0       0
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     2  49.55M      52     681  288.52  621.67  219.26  158.58
# Query size    12   5.15M      30      30      30      30       0      30
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  ######
#   1ms  #
#  10ms  #
# 100ms
#    1s
#  10s+
administrator command: Prepare\G

# Query 4: 335.26 QPS, 0.17x concurrency, ID 0xAC9E2250E1642BFE9823A9B9ECA1A419 at byte 129756612
# Scores: V/M = 0.00
# Time range: 2024-11-16 18:32:09 to 18:33:33
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          5   28162
# Exec time     12     14s     6us    23ms   511us     2ms     1ms    93us
# Lock time     27      1s       0    20ms    36us    38us   280us     8us
# Rows sent      0  27.39k       0       1    1.00    0.99    0.06    0.99
# Rows examine   0  27.06k       0       1    0.98    0.99    0.12    0.99
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     1  19.79M     589     778  736.88  755.64   14.88  719.66
# Query size     7   3.30M     123     123     123     123       0     123
# Boolean:
# QC hit         1% yes,  98% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  ################################################################
# 100us  ############################################
#   1ms  ################
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '3af9b2b1-0111-4add-ab0c-5e122896bcda' ORDER BY timestamp DESC LIMIT 1\G

# Query 5: 1.25k QPS, 0.22x concurrency, ID 0xB8B32624C3268C0925657C305C0ED778 at byte 9451104
# Scores: V/M = 0.00
# Time range: 2024-11-16 18:32:09 to 18:33:09
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count         13   74874
# Exec time     11     13s    13us    27ms   178us   725us   665us    38us
# Lock time     55      2s     3us    23ms    27us    31us   200us     8us
# Rows sent      0       0       0       0       0       0       0       0
# Rows examine   0       0       0       0       0       0       0       0
# Rows affecte  98  73.12k       1       1       1       1       0       1
# Bytes sent     0 960.27k      13      14   13.13   13.83    0.44   12.54
# Query size    42  17.98M     225     291  251.75  271.23   10.98  246.02
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  #########
#   1ms  ##
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
INSERT INTO `isu_condition`     (`jia_isu_uuid`, `timestamp`, `is_sitting`, `condition`, `message`)     VALUES ('f1582599-7d73-4504-b614-589e33390285', '2021-08-10 16:37:25', 1, 'is_dirty=false,is_overweight=false,is_broken=false', 'いい感じです！')\G

# Query 6: 18.08 QPS, 0.07x concurrency, ID 0x5F580A12ADA1633C9634298BE5BD9422 at byte 141452547
# Scores: V/M = 0.00
# Time range: 2024-11-16 18:32:09 to 18:33:09
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          0    1085
# Exec time      3      4s    10us    34ms     4ms    12ms     4ms     2ms
# Lock time      0    24ms       0     3ms    22us    33us   118us     8us
# Rows sent     21 769.66k       6   1.60k  726.39   1.33k  420.98  685.39
# Rows examine  21 767.53k       0   1.60k  724.38   1.33k  422.17  685.39
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     5 112.02M   1.50k 234.41k 105.73k 201.74k  61.22k 101.89k
# Query size     0 122.91k     116     116     116     116       0     116
# Boolean:
# QC hit         0% yes,  99% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  #
# 100us  ################
#   1ms  ################################################################
#  10ms  #######
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '10d7f2b9-1d30-4452-b3ab-469af9e3eccb' ORDER BY `timestamp` ASC\G

# Query 7: 169.83 QPS, 0.04x concurrency, ID 0x8155B89FFD74A9D523D19AC409FD97AF at byte 9454986
# Scores: V/M = 0.00
# Time range: 2024-11-16 18:32:09 to 18:33:09
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          1   10190
# Exec time      2      3s    35us    28ms   258us     1ms   711us    76us
# Lock time      7   264ms     3us    10ms    25us    28us   184us     7us
# Rows sent      0   9.89k       0       1    0.99    0.99    0.08    0.99
# Rows examine   0   9.89k       0       1    0.99    0.99    0.08    0.99
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0   7.16M     589     778  737.15  755.64   14.98  719.66
# Query size     2   1.21M     125     125     125     125       0     125
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us
#  10us  ################################################################
# 100us  ##########################
#   1ms  #####
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu_condition'\G
#    SHOW CREATE TABLE `isucondition`.`isu_condition`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '485096fc-dcdb-4020-b7ea-65279e64668e' ORDER BY `timestamp` DESC LIMIT 1\G

# Query 8: 107.74 QPS, 0.02x concurrency, ID 0x8C2BC651CBBBF3DB41D1CAD61AA0BD68 at byte 103194013
# Scores: V/M = 0.00
# Time range: 2024-11-16 18:32:09 to 18:33:33
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          1    9050
# Exec time      1      1s     7us    12ms   141us   515us   526us    28us
# Lock time      0    10ms       0     2ms     1us       0    26us       0
# Rows sent      0  27.50k       1       7    3.11    5.75    1.45    2.90
# Rows examine   0  11.25k       0      79    1.27       0    7.89       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent    37 701.91M   5.44k 197.01k  79.42k 158.07k  48.92k  62.55k
# Query size     1 480.43k      51      57   54.36   56.92    2.95   51.63
# Boolean:
# QC hit        97% yes,   2% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  #
#  10us  ################################################################
# 100us  #########
#   1ms  ##
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'isu'\G
#    SHOW CREATE TABLE `isucondition`.`isu`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT * FROM `isu` WHERE `character` = 'まじめ'\G

# Query 9: 374.13 QPS, 0.02x concurrency, ID 0xADCA4F127A769A45A2D1B74705103105 at byte 99456752
# Scores: V/M = 0.00
# Time range: 2024-11-16 18:32:09 to 18:33:09
# Attribute    pct   total     min     max     avg     95%  stddev  median
# ============ === ======= ======= ======= ======= ======= ======= =======
# Count          3   22448
# Exec time      0      1s     5us    10ms    50us   113us   282us    10us
# Lock time      0     2ms       0     1ms       0       0     9us       0
# Rows sent      0  21.92k       1       1       1       1       0       1
# Rows examine   0      24       0       1    0.00       0    0.03       0
# Rows affecte   0       0       0       0       0       0       0       0
# Bytes sent     0   1.52M      71      71      71      71       0      71
# Query size     3   1.43M      58      72   66.82   69.19    3.97   65.89
# Boolean:
# QC hit        99% yes,   0% no
# String:
# Databases    isucondition
# Hosts        localhost
# Users        isucon
# Query_time distribution
#   1us  ##################################
#  10us  ################################################################
# 100us  ####
#   1ms  #
#  10ms  #
# 100ms
#    1s
#  10s+
# Tables
#    SHOW TABLE STATUS FROM `isucondition` LIKE 'user'\G
#    SHOW CREATE TABLE `isucondition`.`user`\G
# EXPLAIN /*!50100 PARTITIONS*/
SELECT COUNT(*) FROM `user` WHERE `jia_user_id` = 'suspicious_blackburn'\G
```
:::
```
# Profile
# Rank Query ID                            Response time Calls  R/Call V/M
# ==== =================================== ============= ====== ====== ===
#    1 0xFFFCA4D67EA0A788813031B8BBC3B329  37.6853 32.0%  10285 0.0037  0.00 COMMIT
#    2 0x9C6C682008AE0D08F3E2A0049B030C70  20.0148 17.0%   4151 0.0048  0.01 SELECT isu_condition
#    3 0xDA556F9115773A1A99AA0165670CE848  18.4219 15.6% 180079 0.0001  0.00 ADMIN PREPARE
#    4 0xAC9E2250E1642BFE9823A9B9ECA1A419  14.4006 12.2%  28162 0.0005  0.00 SELECT isu_condition
#    5 0xB8B32624C3268C0925657C305C0ED778  13.3736 11.3%  74874 0.0002  0.00 INSERT isu_condition
#    6 0x5F580A12ADA1633C9634298BE5BD9422   4.1966  3.6%   1085 0.0039  0.00 SELECT isu_condition
#    7 0x8155B89FFD74A9D523D19AC409FD97AF   2.6373  2.2%  10190 0.0003  0.00 SELECT isu_condition
#    8 0x8C2BC651CBBBF3DB41D1CAD61AA0BD68   1.2800  1.1%   9050 0.0001  0.00 SELECT isu
#    9 0xADCA4F127A769A45A2D1B74705103105   1.1349  1.0%  22448 0.0001  0.00 SELECT user
# MISC 0xMISC                               4.8045  4.1% 221609 0.0000   0.0 <87 ITEMS>
```

```
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+------------+
| COUNT | 1XX |  2XX  | 3XX | 4XX | 5XX | METHOD |            URI             |  MIN  |  MAX  |   SUM   |  AVG  |  P90  |  P95  |  P99  | STDDEV | MIN(BODY) | MAX(BODY)  |   SUM(BODY)   | AVG(BODY)  |
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+------------+
| 75638 | 0   | 75529 | 0   | 109 | 0   | POST   | /api/condition/[a-f0-9\-]+ | 0.004 | 0.116 | 445.796 | 0.006 | 0.016 | 0.040 | 0.068 | 0.014  | 0.000     | 14.000     | 56.000        | 0.001      |
| 15237 | 0   | 14465 | 0   | 772 | 0   | GET    | /api/isu/[a-f0-9\-]+       | 0.004 | 0.244 | 334.256 | 0.022 | 0.040 | 0.052 | 0.084 | 0.017  | 0.000     | 135421.000 | 309245262.000 | 20295.679  |
| 362   | 0   | 234   | 0   | 128 | 0   | GET    | /api/trend                 | 0.020 | 1.008 | 313.036 | 0.865 | 1.000 | 1.004 | 1.008 | 0.180  | 8223.000  | 8235.000   | 1870757.000   | 5167.837   |
| 5158  | 0   | 4669  | 0   | 489 | 0   | GET    | /api/condition/[a-f0-9\-]+ | 0.016 | 0.212 | 158.344 | 0.031 | 0.056 | 0.068 | 0.100 | 0.020  | 0.000     | 7042.000   | 25766961.000  | 4995.533   |
| 1694  | 0   | 1624  | 0   | 70  | 0   | GET    | /api/isu                   | 0.004 | 0.144 | 65.640  | 0.039 | 0.064 | 0.072 | 0.100 | 0.020  | 3.000     | 4656.000   | 5099062.000   | 3010.072   |
| 1101  | 0   | 541   | 0   | 560 | 0   | POST   | /api/auth                  | 0.004 | 0.088 | 8.100   | 0.007 | 0.016 | 0.024 | 0.048 | 0.009  | 0.000     | 19.000     | 6440.000      | 5.849      |
| 2709  | 0   | 2129  | 580 | 0   | 0   | GET    | /assets.*                  | 0.000 | 0.016 | 5.072   | 0.002 | 0.004 | 0.008 | 0.012 | 0.003  | 592.000   | 743417.000 | 282688537.000 | 104351.619 |
| 723   | 0   | 331   | 0   | 392 | 0   | GET    | /api/user/me               | 0.000 | 0.064 | 3.808   | 0.005 | 0.012 | 0.020 | 0.036 | 0.008  | 21.000    | 44.000     | 21131.000     | 29.227     |
| 55    | 0   | 51    | 0   | 4   | 0   | POST   | /api/isu                   | 0.004 | 0.112 | 3.700   | 0.067 | 0.084 | 0.108 | 0.112 | 0.022  | 15.000    | 148.000    | 7110.000      | 129.273    |
| 396   | 0   | 323   | 0   | 73  | 0   | POST   | /api/signout               | 0.000 | 0.080 | 3.352   | 0.008 | 0.016 | 0.024 | 0.064 | 0.010  | 0.000     | 21.000     | 1512.000      | 3.818      |
| 768   | 0   | 686   | 82  | 0   | 0   | GET    | /                          | 0.004 | 0.020 | 1.000   | 0.001 | 0.004 | 0.004 | 0.008 | 0.002  | 528.000   | 528.000    | 362208.000    | 471.625    |
| 1     | 0   | 1     | 0   | 0   | 0   | POST   | /initialize                | 0.336 | 0.336 | 0.336   | 0.336 | 0.336 | 0.336 | 0.336 | 0.000  | 23.000    | 23.000     | 23.000        | 23.000     |
| 30    | 0   | 18    | 12  | 0   | 0   | GET    | /isu/[a-f0-9\-]+           | 0.000 | 0.004 | 0.012   | 0.000 | 0.000 | 0.004 | 0.004 | 0.001  | 0.000     | 528.000    | 9504.000      | 316.800    |
| 3     | 0   | 1     | 2   | 0   | 0   | GET    | /register                  | 0.000 | 0.000 | 0.000   | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 0.000     | 528.000    | 528.000       | 176.000    |
+-------+-----+-------+-----+-----+-----+--------+----------------------------+-------+-------+---------+-------+-------+-------+-------+--------+-----------+------------+---------------+------------+
```

![](4-img/img.png)

スロークエリで1位だった`SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '485096fc-dcdb-4020-b7ea-65279e64668e' ORDER BY `timestamp` DESC\G`が、  
4位の`SELECT * FROM `isu_condition` WHERE `jia_isu_uuid` = '3af9b2b1-0111-4add-ab0c-5e122896bcda' ORDER BY timestamp DESC LIMIT 1\G`に変化したことが分かります！改善されましたね！  
今度は、`COMMIT\G`というクエリが1位になっていますね。これは、トランザクションのコミットを行っているクエリです。  
アクセスログを見ると、`POST /api/condition/[a-f0-9\-]+`が最も SUM が多く、pprof をみると、getIsuConditions が最も処理に時間を使っていそうだということが分かります。  
次は何を改善しようかな～
執筆中
