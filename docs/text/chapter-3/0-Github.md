# GitHubを活用する
これから、本格的に計測用のツールを導入して、本格的に計測を行い、改善をし始めます。その上で GitHub は必要不可欠です。

## 改善を簡単に行えるように、GitHub を扱う
サーバー上で操作したり、ファイルを編集するのは、非常に大変です。複数人チームならなおさら混乱します。  
また、間違った操作をしてしまうと、サーバーが壊れてしまい、元に戻せなくて数時間の努力が水の泡になってしまうこともあります。  
なので GitHub 上に、サーバー上のファイルをコピーして、`git`管理を行いましょう。バージョン管理もできるし、手元にファイルを持ってくることもできます。  

## サーバー上に GitHub 用の秘密鍵と公開鍵を作る
サーバーから GitHub にアクセスするために、公開鍵認証を行います。  
サーバー上で以下のコマンドを実行して下さい。
```shell
mkdir ~/.ssh && chmod 744 ~/.ssh/
cd ~/.ssh
ssh-keygen -t ed25519 # 入力を複数回求められるが、全部何も入力せずにEnterで良い
cat id_ed25519.pub

```
これで、秘密鍵と公開鍵ができました。次に以下のコマンドを実行して`config`ファイルに設定を書き込みます。
```shell
cat >> ~/.ssh/config <<EOL
Host github.com
  HostName github.com
  IdentityFile ~/.ssh/id_ed25519
  User git
EOL
```
最後に、以下のコマンドを実行して`config`ファイルの権限を変更します。
```shell
chmod 644 config
sudo chown isucon config
```

## GitHub に公開鍵を登録し、GitHub と公開鍵認証できるようにする
https://github.com/new にアクセスして、新しいリポジトリを作成します。  
今回は練習なのでパブリックでも良いのですが、本番は**必ずプライベートリポジトリ** で作りましょう。
:::danger 
**本番は必ずprivateリポジトリとして作成すること。**

競技中にpublicリポジトリに問題のソースコードをアップしてしまうと、失格になる可能性があります。

> 以下の行為を特に禁止する。
> - 予選の競技終了時間までに、競技の内容に関するあらゆる事項 (問題内容・計測ツールの計測方法など)を公開・共有すること(内容を推察できる発言も含む)
>
> [ISUCON11 予選レギュレーション : ISUCON公式Blog](https://isucon.net/archives/55854734.html)
:::

リポジトリを作成したら、`Settings`から`Deploy keys`を選択し、`Add deploy key`を押します。
![](0-img/img.png)
Key の欄に、先ほど作成した公開鍵(`cat ~/.ssh/id_ed25519.pub`)を貼り付けます。  
Title は何でも良いです。  
**Allow write access** にチェックを入れて(忘れずに！)`Add key`を押します。
![](0-img/img-1.png)

サーバー上で以下のコマンドを実行し、接続できるか確認します。
```shell
ssh -T git@github.com 
```
`Hi pikachu0310/PISCON2024-ISUCON11! You've successfully authenticated, but GitHub does not provide shell access.`と帰ってきたら成功です。

## 必要な物を GitHub にアップロードする
### どれをアップロードするかを決める
基本的に`~/webapp`にアプリケーションが入っているので、そこを GitHub にアップロードします。  
`~/webapp`の中身を見てみましょう。
```shell
cd ~/webapp
ls -lahg
```
```
total 64K
drwxrwxr-x 12 isucon 4.0K Apr 28  2022 .
drwxr-xr-x 18 isucon 4.0K Nov 15 16:16 ..
-rw-rw-r--  1 isucon   20 Apr 28  2022 .gitignore
-rw-rw-r--  1 isucon 6.9K Apr 28  2022 NoImage.jpg
-rw-rw-r--  1 isucon  178 Apr 28  2022 ec256-public.pem
drwxrwxr-x  4 isucon 4.0K Apr 28  2022 frontend
drwxrwxr-x  2 isucon 4.0K Apr 28  2022 go
drwxrwxr-x  5 isucon 4.0K Apr 28  2022 nodejs
drwxrwxr-x  3 isucon 4.0K Apr 28  2022 perl
drwxrwxr-x  7 isucon 4.0K Apr 28  2022 php
drwxrwxr-x  3 isucon 4.0K Apr 28  2022 public
drwxrwxr-x  2 isucon 4.0K Apr 28  2022 python
drwxrwxr-x  3 isucon 4.0K Apr 28  2022 ruby
drwxrwxr-x  4 isucon 4.0K Apr 28  2022 rust
drwxrwxr-x  2 isucon 4.0K Apr 28  2022 sql
```
これを見ると、大体以下のようになっていそうです。
```
/home/isucon/webapp/
├── frontend  # フロントエンドのソースコード
├── go        # Go実装
├── nodejs    # Node.js実装
├── perl      # Perl実装
├── php       # PHP実装
├── public    # jsやcss、画像データ等の静的ファイル
├── python    # Python実装
├── ruby      # Ruby実装
├── rust      # Rust実装
└── sql       # データベースのスキーマおよび初期化に必要なSQL
```
主に改善に使うのは`go`と`sql`だと思うので、と`go`と`sql`を GitHub にアップロードします。  

### .gitignore に追加する。
注意点として、でかいファイルがあれば、`.gitignore`に追加しましょう。まずは`go`の中身を確認します。  
:::tip
`du -d 1 -h`というコマンドを使うと、大きいファイルに気が付きやすい
:::
```shell
cd ~/webapp/go
ls -lahg
```
```
isucon@ip-192-168-0-11:~/webapp/go$ ls -lahg
total 9.5M
drwxrwxr-x  2 isucon 4.0K Apr 28  2022 .
drwxrwxr-x 12 isucon 4.0K Apr 28  2022 ..
-rw-rw-r--  1 isucon   13 Apr 28  2022 .gitignore
-rw-rw-r--  1 isucon  372 Apr 28  2022 go.mod
-rw-rw-r--  1 isucon 5.7K Apr 28  2022 go.sum
-rwxrwxr-x  1 isucon 9.4M Apr 28  2022 isucondition
-rw-rw-r--  1 isucon  35K Apr 28  2022 main.go
```
`isucondition`というファイルがバイナリファイルで`9.4M`と容量がでかいので、`.gitignore`に追加しようと思ったのですが、`.gitignore`ファイルで既に設定されていますね。  

同様に`sql`の中身を確認すると、`1_InitData.sql`が大きいので、`.gitignore`に追加します。(実は`~/webapp`内の`.gitignore`に書かれてますが、練習ということで)  
```shell
cd ~/webapp/sql
ls -la
echo "1_InitData.sql" >> .gitignore
```

### GitHub にアップロードする
まずは、自分のGitHubのアカウントでGitHubにコミットするために、以下の設定しましょう。(自分のメアドと名前に置き換えて)
```shell
git config --global user.email "pikachu13711@gmail.com"
git config --global user.name "pikachu0310"
```
次に、`~/`に戻って、以下のコマンドを実行し、GitHubにアップロードします。  
以下のコマンドを順番に実行します。  
ただし、7行目の`git@github.com:pikachu0310/isucon-workshop-2024.git`を自分のリポジトリに置き換えてください。
```shell
cd ~
git init
git add webapp/go webapp/sql
git status # 確認
git commit -m ":tada: Initial commit"
git branch -M main
git remote add origin git@github.com:pikachu0310/isucon-workshop-2024.git
git push -u origin main
```
これで、GitHub にアップロードできました！自分のレポジトリにアクセスして、確認してみましょう。
![](0-img/img-2.png)

## GitHub から手元にファイルを持ってくる
GitHub にアップロードしたファイルを手元に持ってきます。  
分かる人は好きなところにクローンしてください。  
以下のコマンドは、自分のPC上で実行してください。  
```shell
mkdir github
cd github
git clone 自分のレポジトリURL
```
これで、サーバー上のファイルが手元に来ました！  
これからは、手元でファイルを編集してGitHubにPushし、サーバー上でPullすることで、手元のファイルの変更をサーバー上に反映させます。
試しに`README.md`を作って、GitHubにPushしてみましょう。  
これからは贅沢にもテキストエディタが使えるので、好きなテキストエディタで`README.md`を書きましょう。例えば以下のように描きます。
```markdown
# ISUCON11予選 (PISCON2024)
## 問題に関連するリンク
[ISUCON11 予選当日マニュアル](https://github.com/isucon/isucon11-qualify/blob/main/docs/manual.md#isucondition-%E3%81%B8%E3%81%AE%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3)
[ISUCONDITION アプリケーションマニュアル](https://github.com/isucon/isucon11-qualify/blob/main/docs/isucondition.md)
[ISUCON11 予選レギュレーション](https://isucon.net/archives/55854734.html)
[PISCON Portal](https://piscon.trap.jp/dashboard)
[ISUCON初心者向け講習会資料](https://isucon-workshop.trap.show/)

## アプリのディレクトリ構造
/home/isucon/webapp/
├── frontend  # フロントエンドのソースコード
├── go        # Go実装
├── public    # jsやcss、画像データ等の静的ファイル
└── sql       # データベースのスキーマおよび初期化に必要なSQL

## その他ISUCONで使いそうなファイルの場所
/home/isucon/env.sh # 環境変数の設定ファイル
/etc/nginx/nginx.conf # Nginxの設定ファイル
/etc/mysql/mariadb.conf.d/50-server.cnf # MySQLの設定ファイル
/etc/systemd/system/isucondition.go.service # アプリケーションのsystemdサービスファイル
```
変更したら、GitHubにPushしましょう。(自分のPC上で実行)
```shell
cd <クローンしたディレクトリ>
git add README.md
git commit -m ":memo: README.mdを追加"
git push
```
GitHub上の変更をサーバーに反映させる。(サーバー上で実行)
```shell
cd ~ && git pull
cat README.md
```
これで`README.md`が表示されれば、成功です！
これで`webapp/go/main.go`や`webapp/sql/01_schema.sql`ファイルをわざわざサーバー上で編集する必要が無くなり、ローカルでコーディングできるようになりました！
![](0-img/img-3.png)
