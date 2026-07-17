# AI Agentに改善を任せる、その頼み方まで残す

今回の応用編は、最初から完成された1個のpromptで走ったわけではありません。

まず1台で計測を始め、途中で「3台まで使ってよい」と伝え、目標scoreを渡し、時間を延長しました。Agentが走りながら見つけた失敗へ、人間が次の目的を足していったのです。

このページでは、その頼み方も実験結果の一部として残します。次のISUCONで同じcodeを書かせるためではありません。**別の問題でも、計測して考え、壊したら戻し、最後に提出できる状態へ着地するAgent**を再現するための設計図です。

## どこまで「再現できる」と言えるのか

今回のGo実装、初期化SQL、nginx、MariaDB、systemd、3台deploy、外部benchmarkの作り方はGitへ残しました。公式AMI、公式benchmarkのcommit、TLS certificateとinitialize dataのhashも記録しています。

そのため、AWSのinstanceを削除しても、同じ役割分担の3台構成を作り直せます。

ただし、`3,072,854`点という数字まで同じになる保証はありません。EC2の物理hostやnetworkの混雑でscoreは揺れます。再現するのは、次の3つです。

1. 同じsourceと設定をfresh AMIへdeployできる
2. 3台をrebootしても自動復帰する
3. initialize後の公式benchmarkが`pass / deduction 0`になる

「同じcode」と「同じscore」は別です。ここを分けておくと、少し数字が下がっただけで再構築失敗だと慌てずに済みます。

実際、削除前に外部benchmark一式を公式commitと公開AMIから作り直した確認runは`466,318 / pass / deduction 0`でした。最高`3,072,854`点と同じcodeでも、network timeoutが`1,446`まで増えれば数字は大きく変わります。それでも完走して正しさを確認できたため、測定系の再構築は成功と判断しました。

許可された3台はすべて使用中だったため、4台目のfresh EC2へdeployするtestまでは行っていません。scriptのsyntax、配布対象、Go test、外部benchmarkの再構築は確認済みです。まっさらなAMIからのend-to-end testまで必要なら、削除前にworkerを1台入れ替えて試すのが最後の一段です。

> **注意:** 実験用repositoryは現在privateです。完全に第三者が再構築するには、repositoryを公開するか、参加者へ権限を渡す必要があります。AWSを削除する前に、作業branchとDraft PRがGitHubへpush済みであることを確認してください。

環境の細かなversionと削除checklistは、実験repositoryの`records/REPRODUCE.md`へ置きました。公開AMIは東京regionの`ami-0796be4f4814fc3d5`です。workerで使った別AMIは再現に必要なく、3台とも公開AMIから作り、Gitの内容をdeployできます。

## 実際には、いつ何を頼んだのか

wall clockの時刻ではなく、依頼した順番と追加した時間枠を載せます。「最初の一言ですべて伝えた」ことにしてしまうと、次に試す人が同じ条件を作れません。

| 段階              | 人間から追加した指示                                                                                        | Agentの動きがどう変わったか                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 準備              | `matsuu/aws-isucon`でISUCON11予選をAWSへ作り、去年の資料どおり実行する                                      | 公開AMIと講習資料を起点にした                            |
| 開始              | instance起動を許可し、**起動と同時に競技開始**とした                                                        | SSH、Git、初回benchmark、仕様確認を並行した              |
| 最初の約1時間     | slow query log、access log、pprofを順番に入れ、各計測から分かる改善を行う。解説記事は禁止。大規模変更も許可 | 初心者向けの道筋を保ちながら、自走loopへ移った           |
| 応用を約4時間追加 | 最大3台を許可。AMIから増設してよい。判断に使ったtextやpprof画像を残す。1位を狙う                            | memory化と役割分割を進め、失敗runも教材へ残した          |
| さらに約6時間追加 | 1位`1,464,232`点、30位`92,604`点を共有し、改善と応用編執筆を続ける                                          | 「そこそこ速い」ではなく、測定経路や仕様の抜けまで疑った |
| 終了              | 改善cornerを終了し、削除前の再現性と次回のpromptを精査する                                                  | 新しい高速化を止め、再構築手順と学びを固定した           |

依頼上の時間枠は合計で約11時間です。途中のsteering、つまり走っているAgentへの追加指示も成果の一部でした。

## 最初から渡せば、もっと速かった情報

今回、後から渡した情報には大きな価値がありました。ただ、実競技では最初のpromptへ入れた方が速く進みます。

### 1. scoreの目標と測定条件

1位と30位のscoreを最初に知っていれば、2万点で満足せず、早い段階から構造変更を検討できます。

同時に、「benchmarkはapplicationと同居か、別hostか」も必要です。今回、同居benchmarkのscoreとWSLからの外部scoreが混ざりかけました。測定場所が変わったscoreは、同じ表の連続した伸びとして扱えません。

### 2. 最大3台を最初から使えること

1台で計測する時間も無駄ではありません。分けるべき役割を知るために必要です。

それでも、3台を使えると最初から分かっていれば、準備を先にできます。たとえばprivate IPをsourceへ書かず、state同期の境界をtestできます。今回の3台化直後は、新規userをworkerへ同期できず0点になりました。

### 3. benchmark sourceと採点の内訳

manualだけでなく、公式benchmarkの次を早く読むと効きます。

- 何をすると加点されるか
- timeoutとdeductionはどう違うか
- 登録直後に最初のconditionが届くまで何ms待つか
- GraphGood、GraphBadなどの内訳が何を数えるか
- `pass`になるための整合性check

今回、JIAの50ms待ちを読んだことで、activateの前にworkerを仮登録する構造へ進めました。これはhandlerの数msを削るより大きな改善でした。

### 4. AWSとGitで許可される操作

Agentは「できるか」より「やってよいか」で止まりやすいです。

最初に次を明記します。

- instanceの起動と最大台数
- reboot、package導入、設定変更の可否
- instance削除は競技中に行わない
- private repository作成、commit、push、Draft PRの可否
- credentialや秘密鍵はGitへ入れない

権限が曖昧なまま自走を求めると、大きな設計より確認待ちが増えます。

### 5. 「終了」の判定

scoreが上がる限り、Agentは改善を続けられます。だから終了条件も競技の一部です。

- 終了60分前から大規模な構造変更をしない
- 終了30分前に3台をrebootする
- serviceの自動復帰、initialize、最終benchmarkを行う
- `pass / deduction 0`でなければ最高scoreでも採用しない
- fresh cloneからdeployできるfileをGitへ残す

今回、serviceが`active`でもnetworkの準備が終わらず、reboot直後の最初のrunが0点になりました。「processがいる」と「提出できる」は違います。

## 今回の失敗から作る短いchecklist

| 起きたこと                                        | 次回、最初から入れる仕組み                                            |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| memoryの過大な事前確保で`43,682 → 34,599`         | 件数×1件の大きさを計算し、変更前後のheapを比べる                      |
| 3台化直後に新規user同期漏れで0点                  | 分散前に「誰が何を持つか」を表にし、登録・初期化のcontract testを書く |
| 外部runが途中8.8万点でもnetwork断で失敗           | 部分scoreではなく、最後の`pass`とdeductionを採用条件にする            |
| pprofの箱だけを見るとGoが忙しそうに見えた         | 30秒中のtotal sampleとOS全体のCPU idleを一緒に見る                    |
| applicationよりSSH tunnelが遅かった               | benchmark host、JIA、DNS、networkも測定系として観測する               |
| 286万点でtrendを固定した疑いが残った              | responseのhashが時間とともに変わるか、仕様probeを追加する             |
| public/private IPをscriptへ固定した               | IPは環境変数から設定fileへ描画する                                    |
| workerだけ別AMIになりversion差が出た              | 3台とも同じ公開AMIから作り、Gitから全部deployする                     |
| reboot直後、service activeでもinitializeがtimeout | SSHと443のreadiness checkを最終runの前に置く                          |

成功した変更だけをpromptへ詰めるより、**どう失敗を見抜くか**を渡す方が別の問題でも役に立ちます。

## 次の本番で使う `/goal` prompt

CodexのGoal modeは、長い仕事の「目的」と「完了条件」を同じtaskに保つ機能です。公式資料でも、outcome、constraints、verificationを含めることが勧められています。まず`<...>`を本番の情報に置き換えます。

```text
/goal

目的:
競技終了 <YYYY-MM-DD HH:MM JST> までに、公式benchmarkが正しいと認めるscoreを最大化し、
再起動後にも再現できる提出状態を完成させてください。
目標は <1位score>、最低目標は <通過border> です。

与えられている環境:
- 作業場所: <WSL / local path>
- server: <SSH user、public IP、private IP、役割>
- 使用可能台数: 最大 <N> 台。必要なら増設してよい
- repository: <URL / branch>
- benchmark 1回の所要時間: 約 <秒数>
- applicationとbenchmarkの配置: <同居 / 別host>
- 使用言語: <Goなど>

権限と禁止事項:
- SSH、package導入、設定変更、service restart、reboot、Git commit/pushを許可する
- instanceのterminate、AMI・snapshot・volumeの削除は行わない
- credential、秘密鍵、生の巨大log、build済みbinaryをcommitしない
- 解説記事、他teamの解答、過去の優勝者記事は見ない
- 公式manual、公式source、server内の実装、実測値だけを根拠にする
- 仕様を守れるなら、大規模refactor、memory化、serverの役割分割を許可する

最初の15分で行うこと:
1. date、残り時間、server台数、CPU、memory、disk、OS、service、portをinventoryする
2. 変更対象だけをGit管理し、戻せるcheckpointを作る
3. 初回benchmarkを変更前に1回行う
4. score、pass、deduction、timeout、採点内訳、測定場所、Git commitを記録する
5. benchmark実行中に公式manualと公式benchmark sourceを読み、加点と失格条件を要約する
6. 外部依存、DNS、認証、initialize、再起動時のstateを図にする

改善loop:
- slow query log、access log、pprof、vmstatなどを必要な順に導入する
- 「計測→上限の仮説→同じ仮説に属する変更→test→同条件の再計測」を繰り返す
- benchmarkが1分動いている間は、前runのlog解析、公式source確認、記録更新を並行する
- 一度にまとめる変更は、一つの仮説で説明できる範囲にする
- scoreだけでなく、route別件数とlatency、DB時間、CPU total sample、OS idle、networkを確認する
- applicationがidleなら、測定経路、benchmark、外部service、同期方式を疑う
- 小さい改善で上限が動かないときは、仕様上のstateを整理して構造変更を検討する
- 失敗runも、観測、原因、revert理由を消さずに記録する
- passしないrun、deductionがあるrun、測定条件が違うrunを最高記録にしない

subagent:
- 独立したread-only作業にはsubagentを使ってよい。明示的に並列化する
- main Agentだけがlive serverのdeploy、restart、benchmark、Git統合を行う
- 例: 公式仕様・採点担当、telemetry担当、code/state境界とtest担当
- subagentには結論、根拠のfile/line、次に試す仮説だけを短く返させる
- 2つのAgentに同じfileや同じserverを書かせない
- benchmark中に別Agentが環境を変更しない

各runの記録:
- 時刻、残り時間、構成、測定場所、Git commit
- score、pass、deduction、timeout、採点内訳
- 見えたこと、仮説、変えたこと、結果、採用/不採用、次に見るもの
- 判断に使ったslow query要約、access log集計、pprof top、必要な画像

時間管理:
- 30分ごとにscore推移と現在の上限を振り返り、次の30分の仮説を一つ選ぶ
- 終了60分前から、根拠の弱い大規模変更を始めない
- 終了30分前に改善を止め、fresh deploy相当の確認へ移る
- 全serverをrebootし、service、port、内部通信、initializeを確認する
- 最終benchmarkを実行し、pass / deduction 0を確認する
- READMEだけでclone、deploy、benchmarkを再現できるか確認する

完了条件:
- 有効な最高scoreと同条件の再現runが記録されている
- test、build、設定syntax checkが通る
- reboot後の最終benchmarkがpass / deduction 0である
- 必要なsource、設定、deploy script、score履歴、判断材料がGitにある
- 最終構成、残ったrisk、不採用案、次に試す案が短くまとめられている

人間への報告は各benchmark後または10分ごとに短く行ってください。
権限内の通常作業で確認待ちにならず、完了条件まで自走してください。
```

長く見えますが、手順を1個ずつ命令するための長さではありません。「自由に大きく動いてよい範囲」と「絶対に守る境界」を先に渡すための長さです。

## 走り始めたあとに送るsteering

Goalを始めたあとも、状況が変われば同じtaskへ追加情報を送れます。今回のような延長も、最初の目的を捨てずに足せます。

### scoreが頭打ちになったとき

```text
直近5runでscoreの上限が動いていません。
小さいhotspot修正を一度止め、採点式、load generator、外部service、server間同期、
測定経路のどこが上限かを再評価してください。
必要ならUltra相当の深いreasoningで、大規模変更を含む仮説を3案比較し、
最も検証が速い案から1つだけ実行してください。
```

### 3台化を始めるとき

```text
最大3台を使えます。
増やす前に、現在のCPU、memory、I/O、request分布から、分ける役割を説明してください。
stateの所有者、初期化、登録直後、更新順序、障害時のfallbackを表にし、
contract testを追加してからdeployしてください。
main Agentだけが3台へ変更を反映し、subagentはread-onlyで検証してください。
```

### 残り1時間になったとき

```text
残り60分です。新しい高速化より提出可能性を優先してください。
未commit差分、設定file、秘密情報、起動時依存を監査し、30分後には改善を止めます。
3台reboot、readiness、initialize、最終benchmark、Git pushまでの順番と所要時間を出し、
そのまま実行してください。
```

## subagentが強い理由

はい。ISUCONとはかなり相性がよいです。

benchmarkが約1分走っている間、main Agentが画面を眺める必要はありません。別のAgentが公式sourceを読んだり、前runのaccess logを集計したりできます。長いlogをmainの会話へ全部入れず、要約だけ返せるのも利点です。

一方で、Agentを増やせば自動的に速くなるわけではありません。live serverは1つの共有物です。2人が同時にnginxを変え、別々にrestartしたら、次のscoreがどちらの変更によるものか分からなくなります。

おすすめの分担は次です。

| 担当                  | 主な仕事                                    | 書き込み権限                   |
| --------------------- | ------------------------------------------- | ------------------------------ |
| main / driver         | 仮説の選択、live deploy、benchmark、Git統合 | live serverとmain branchを専有 |
| 公式仕様scout         | manual、採点、benchmark source、失格条件    | read-only                      |
| telemetry analyst     | slow query、access log、pprof、vmstatの比較 | raw dataを読むだけ             |
| state / test reviewer | endpoint、state所有、race、初期化のtest観点 | 原則read-only。変更案を返す    |

最初はsubagentを2〜3個に絞ります。同時実行数は環境設定で変わります。書き込み作業まで並列化するなら、同じcheckoutではなくGit worktreeを分け、それでもlive deployはmainだけが行います。

[Codex公式のSubagents資料](https://learn.chatgpt.com/docs/agent-configuration/subagents)でも、探索、test、triage、要約のようなread-heavy作業から始め、同時書き込みには注意するよう案内されています。

## Extra HighとUltraの選び方

今回使ったのは、画面上の`GPT-5.6 Sol / Extra High`です。結果を見る限り、長時間の実装と検証を続ける力は十分でした。

次の本番でUltraを使えるなら、**main AgentはUltraで始める**のがおすすめです。ISUCONでは、局所的な数msより「採点の増え方」「stateの置き場所」「3台の役割」を読み替える場面があり、深いreasoningの価値が高いからです。Ultraは、適切な独立作業を自分からsubagentへ渡せる点も相性がよいです。

ただし、全作業を一番重い設定へ固定するのが最速とは限りません。高いreasoningは時間とtokenを多く使います。

- 開始時の仕様・採点・全体構造: Ultra
- 頭打ち時の原因再評価、大規模設計の比較: Ultra
- 明確な修正、deploy、syntax check、log整形: Extra High以下でもよい
- 大量fileの探索と要約をするsubagent: 速度重視のmodelを使う
- correctness reviewer: `gpt-5.6`のHigh以上を使う

つまり、**driverは深く、scoutは速く**です。設定を1つだけ選び、競技中に切り替えたくないならUltraを選びます。ただし、10分で終わる機械的作業までUltraの考察を待つより、役割別modelを設定したsubagentと組み合わせる方がwall clockでは有利です。

現在の公式資料では、`gpt-5.6`が難しいAgent作業の出発点とされています。Extra Highは長時間でreasoning-heavyな作業向けです。Ultraは対応accountとmodelで使える最大reasoningです。適切なsubagentへの自発的な委譲も行います。設定名や提供条件は変わり得るため、本番前日に[Models](https://learn.chatgpt.com/docs/models)と[Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)を確認してください。

## promptだけで終わらせない

同じ注意を毎回promptへ貼るより、置き場所を分けると安定します。

- `/goal`: 今回の終了時刻、score目標、server、完了条件
- `AGENTS.md`: benchmarkの採用条件、Gitへ入れないもの、live serverの所有者
- repository内のrunbook: deploy、benchmark、reboot、復旧手順
- Skill: ISUCONごとに繰り返す計測loopや記録format

[Goal modeの公式資料](https://learn.chatgpt.com/docs/long-running-work)では、結果、制約、検証方法をgoalへ含めることが勧められています。[AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)はrepositoryと一緒に運ぶ恒久的な指示、Skillは何度も使うworkflowに向いています。

今回の実験repositoryには`AGENTS.md`も追加しました。次回は競技開始前に新しいrepositoryへcopyし、問題固有のcommandと終了時刻だけを書き換えます。

## 最後に

今回、Agentを強くしたものは「全部好きにやって」だけではありませんでした。

- 公式情報と実測だけを使う
- 大規模変更を許可する
- 最大3台と目標scoreを伝える
- 失敗と証拠を教材へ残す
- reboot後のpassまでを終了条件にする

この5つがそろったから、Agentは大胆に動きながら、最後はGitへ戻ってこられました。

AI Agentへ競技を任せるのは、運転席を空にすることではありません。目的地、コースの境界、計器、pitへ戻る時刻を渡すことです。そこまで準備できたら、あとは一緒にアクセルを踏んでみましょう。
