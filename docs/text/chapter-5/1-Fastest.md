# 最速で環境構築をする
コピペするときは以下の値を自分のに置き換えてください。置換でいけます。
```
グローバルIP: `18.183.138.50`
ローカル公開鍵: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO3aFsxQ60hI/ZFy5vJ+N6C0ONFBkfoQXz2PuTMK+poi`
gitメアド: "pikachu13711@gmail.com"
gitユーザーネーム: "pikachu0310"
gitリポジトリ名: "isucon-workshop-2023summer"
```
`https://piscon.trap.jp/team`でインスタンスを立てる。  
:::details サーバーの接続設定
ローカルPC上で以下のコマンドを実行。
```shell
cat >> ~/.ssh/config <<EOL

Host isucon9-1
  HostName 18.183.138.50
  IdentityFile ~/.ssh/id_ed25519
  User isucon
EOL
cat ~/.ssh/id_ed25519.pub
ssh isucon@18.183.138.50
```
サーバー上で以下のコマンドを実行。
```shell
cd ~ && mkdir .ssh && chmod 744 ~/.ssh/
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIO3aFsxQ60hI/ZFy5vJ+N6C0ONFBkfoQXz2PuTMK+poi" >> .ssh/authorized_keys
:::
:::details ベンチマークが動くようにする設定
```shell
sudo bash -c 'cat <<EOL > /etc/nginx/sites-available/isucari.conf
server {
        # listen 443 ssl;
        # server_name isucon9.catatsuy.org;

        # ssl_certificate //etc/nginx/sites-available/isucari.confssl/fullchain.pem;
        # ssl_certificate_key //etc/nginx/sites-available/isucari.confssl/privkey.pem;

        location / {
                        proxy_pass http://127.0.0.1:8000;
        }
}
EOL
'
sudo nginx -t
sudo systemctl reload nginx
```
:::
:::details githubの設定
```shell
cd ~/.ssh
ssh-keygen -t ed25519
cat >> ~/.ssh/config <<EOL
Host github.com
  HostName github.com
  IdentityFile ~/.ssh/id_ed25519
  User git
EOL
chmod 644 config
sudo chown isucon config
cat id_ed25519.pub
```
https://github.com/new でレポジトリ作ってデプロイキー登録。
```shell
ssh -T git@github.com
cd ~/isucari
echo "isucari" >> webapp/go/.gitignore
echo "initial.sql" >> webapp/sql/.gitignore
git config --global user.email "pikachu13711@gmail.com"
git config --global user.name "pikachu0310"
git init
git add webapp/README.md webapp/go webapp/sql webapp/docs
git commit -m ":tada: Initial commit"
git branch -M main
git remote add origin git@github.com:pikachu0310/isucon-workshop-2023.git
git push -u origin main
```
:::
:::details スロークエリログ:pt-query-digestの導入
```shell
sudo bash -c 'cat <<EOL >> /etc/mysql/mysql.conf.d/mysqld.cnf
slow_query_log         = 1
slow_query_log_file    = /var/log/mysql/mysql-slow.log
long_query_time = 0
EOL
'
sudo systemctl restart mysql
mkdir ~/tools
cd ~/tools
wget https://github.com/percona/percona-toolkit/archive/refs/tags/v3.5.5.tar.gz
tar zxvf v3.5.5.tar.gz
sudo install ./percona-toolkit-3.5.5/bin/pt-query-digest /usr/local/bin
mkdir ~/isucari/log
```
:::
:::details アクセスログ:alpの導入
```shell
wget https://github.com/tkuchiki/alp/releases/download/v1.0.21/alp_linux_amd64.tar.gz
tar zxvf alp_linux_amd64.tar.gz
sudo install alp /usr/local/bin

sudo bash -c 'cat <<EOL > /etc/nginx/nginx.conf
user www-data;
worker_processes 1;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

error_log  /var/log/nginx/error.log error;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server_tokens off;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 120;
    client_max_body_size 10m;

    log_format ltsv "time:$time_local"
                    "\thost:$remote_addr"
                    "\tforwardedfor:$http_x_forwarded_for"
                    "\treq:$request"
                    "\tstatus:$status"
                    "\tmethod:$request_method"
                    "\turi:$request_uri"
                    "\tsize:$body_bytes_sent"
                    "\treferer:$http_referer"
                    "\tua:$http_user_agent"
                    "\treqtime:$request_time"
                    "\tcache:$upstream_http_x_cache"
                    "\truntime:$upstream_http_x_runtime"
                    "\tapptime:$upstream_response_time"
                    "\tvhost:$host";

    access_log /var/log/nginx/access.log ltsv;

    # TLS configuration
    ssl_protocols TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

    include conf.d/*.conf;
    include sites-enabled/*.conf;
}
EOL
'
sudo nginx -t
sudo systemctl reload nginx
```
:::
:::details ベンチマークの前に回すコマンド
```shell
cd ~/isucari && git pull
cd ~/isucari/webapp/go && make isucari && sudo systemctl restart isucari.golang.service
mkdir ~/isucari/log
sudo pt-query-digest /var/log/mysql/mysql-slow.log > ~/isucari/log/$(date +mysql-slow.log-%m-%d-%H-%M -d "+9 hours") && sudo rm /var/log/mysql/mysql-slow.log && sudo systemctl restart mysql
sudo cat /var/log/nginx/access.log | alp ltsv -m "/users/\d+.json","/items/\d+.json","/new_items/\d+.json","/upload/.+.jpg","/transactions/\d+.png" --sort sum -r > ~/isucari/log/$(date +access.log-%m-%d-%H-%M -d "+9 hours") && sudo rm /var/log/nginx/access.log && sudo nginx -t && sudo systemctl reload nginx
```
:::

