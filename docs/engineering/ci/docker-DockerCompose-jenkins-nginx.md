# Docker + DockerCompose + Jenkins + Nginx 部署前端项目

## Centos8 安装 Docker

切换 root 安装工具包等

```sh
yum install -y yum-uitls device-mapper-persistent-data lvm2
```

设置 docker 后续拉取镜像时的仓库地址

```sh
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

安装 docker 社区版和命令行

```sh
yum install docker-ce docker-ce-cli containerd.io
```

docker 安装成功之后设置开机自启动

```sh
# 开机自启
systemctl enable docker
# 启动 docker 服务
systemctl start docker
```

查询 docker 版本确认 docker 安装正确，如显示版本号，则安装正确

```sh
docker -v
```

更改镜像加速地址，安装完毕后默认没有 daemon.json 文件，需要手动创建，以阿里云镜像为例

```sh
mkdir -p /etc/docker
tee /etc/docker/daemon.json <<-'EOF'
{ "registry-mirrors": ["https://sdh86fuc.mirror.aliyuncd.com"] }
EOF
```

使 daemon.json 生效，重启 docker

```sh
systemctl daemon-reload
systemctl restart docker
```

## 创建目录
在服务器根目录下创建一下文件夹，结构如下

```
- docker
  - compose               dir
    - docker-compose.yml
  - jenkins               dir
    - jenkins_home        dir
  - nginx                 dir
    - conf.d              dir
      - nginx.conf
  - webserver             dir
    - static              dir
      - docs              dir
```

## docker-compose 

docker-compose 项目是 Docker 官方的开源项目，负责实现对 Docker 容器集群的快速编排。允许用户通过一个单独的 docker-compose.yml 模板文件（YAML 格式）来定义一组相关联的应用容器为一个项目（project）

使用 compose 的最大优点是你只需在一个文件中定义自己的应用程序栈（即应用程序需要用到的所有服务），然后把这个 YAML 文件放在项目的根目录下。其他人只需 clone 你的项目源码之后就可以快速启动服务

通常适用于项目所需运行环境（对应多个 docker 容器）较多的场景，例如同时依赖于 nodejs、mysql、mongodb、redis 等

### 常用命令

- 构建容器 `docker-compose build <service-name>`

- 启动所有服务 `docker-compose up -d` (后台启动)

- 停止所有服务 `docker-compose down`

- 查看服务 `docker-compose ps`

### 安装 docker-compose

```sh
# 下载最新版本的 docker-compose 到 /usr/bin 目录下
curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 给 docker-compose 授权
chmod +x /usr/bin/docker-compose
```

安装完，命令行输入 `docker-compose`，显示版本号代表安装成功

### docker-compose.yml

编写 docker-compose.yml，存放在 /docker/compose/ 目录下

```yml
version: '3'
# 集合
services:
  docker_jenkins:
    user: root                    # 用户 
    restart: always               # 重启方式
    image: jenkins/jenkins:lts    # 指定服务所使用的镜像 （lts 长期支持）
    container_name: jenkins       # 容器名称
    ports:
      - 8082:8080                 # 对外暴露的端口定义，jenkins 默认访问端口 8080，宿主机可以用 127.0.0.1:8082 直接访问到 jenkins
      - 50000:50000
    volumes:                      # 卷挂载路径
      - /docker/jenkins/jenkins_home/:/var/jenkins_home   # 将服务器 /docker/jenkins/jenkins_home/ 目录挂载到容器内的 /var/jenkins_home 目录下
      - /var/run/docker.sock:/var/run/docker.sock       # 将服务器 /var/run/docker.sock 挂载到容器 /var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker                 # 将服务器 /usr/bin/docker 挂载到容器 /usr/bin/docker 下，为了可以在容器内使用 docker 命令
      - /usr/local/bin/docker-compose:/usr/local/bin/docker-compose   # 为了可以在容器内使用 docker-compose 命令
  docker_nginx:
    restart: always
    image: nginx
    container_name: nginx
    ports:
      - 8090:80
      - 80:80
      - 433:433
    volumes:
      - /docker/nginx/conf.d/:/etc/nginx/config.d
      - /docker/webserver/static/docs/:/usr/share/nginx/html    # 将服务器 /docker/webserver/static/docs/ 目录下的文件映射到容器 /usr/share/nginx/html 目录下 （nginx 默认网页存放目录）
```

ports 和 volumes 中，容器如何映射到宿主机。

使用 `<容器>:<宿主机>` 的形式，`:` 前面是填写容器相关的信息，`:` 后面填写宿主机相关的信息

::: tip
记得去阿里云服务器开通 8082 端口的访问
:::


## 编写 nginx.conf

进入 /docker/nginx/conf.d/，输入以下命令

```sh
vim /docker/nginx/conf.d/nginx.conf
```

```
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html index.htm;
}
```

## 启动 docker-compose

进入 docker-compose.yml 存放的目录下，输入以下命令启动 docker-compose

```sh
docker-compose up -d
```

输入 `docker ps` 查看容器的情况， status 为 up 表示已启用，在浏览器输入 `<ip>:8085` 会进入 jenkins 安装页面

进入页面之后，会弹窗让你输入 jenkins 密码，输入以下命令获取密码

```sh
docker logs <Container Id>
```

输入密码进入之后，选择 `安装推荐的插件`

## 安装 jenkins 插件

安装必要插件：

- Publish Over SSH
- nodejs 编译打包项目

在 jenkins 首页选择 `Manage Jenkins` -> `Manage Plugins` 安装 publish over ssh 和 nodejs 插件

### 配置 Publish Over SSH
 
Manage Jenkins -> Configure System -> 找到 Publish over SSH

- 输入服务器的密码 `Passphrase`
- 点击新增
- 填入 Name ，内容随便取
- 填入 Hostname，服务器地址 （ip）
- 填入 Username，服务器账户
- 填入 Remote Directory，服务器下静态文件的地址 `/docker/webserver/static`
- 点击保存

### 配置 nodejs

Manage Jenkins -> Global Tool Configuration -> NodeJS -> 新增 NodeJS -> 填入别名 -> 选择版本号 -> 点击保存

## jenkins 与 github 集成

### 生成公钥私钥

在命令行输入以下命令

```sh
ssh-keygen -t rsa
```

进入私钥目录

```sh
cd ~/.ssh
```

私钥存放在 `id_rsa` 文件，公钥存放在 `id_rsa.pub` 文件中

登陆 `github.com` -> 进入 Settings -> SSH and GPG keys -> New SSH key -> 填入刚才生成的公钥


### 新建 item

#### 源码管理

点击 `新建 Item` -> 选择 `Freestyle project` -> 输入任务名称

选择 `源码管理` -> `选择 Git` -> 在 `Repository URL` 填入代码仓库地址 -> 添加 `Credentials` -> 类型选择 `SSH Username with private key` -> Username 填入 root -> 勾选 `Enter directly` 输入刚才生成的私钥 -> 点击添加 -> 选择刚才添加的凭证 -> 选择指定分支

#### 构建环境

- 构建环境选择 `Provide Node & npm bin/ folder to PATH`
- 选择配置好的 Node

#### 构建
输入构建的命令，例子

```sh
npm i
npm run build
tar cvf dist.tar dist
```

#### 构建后操作
`增加构建步骤` -> 选择 `Send files or execute command over SSH` (通过 ssh 发送文件或执行命令)

- SSH Server
- Name 选择之前配置好的服务器
- Transfers
- Source files 输入要发送的文件名 （这里使用 dist.tar）
- Remote directory 输入要发送的服务器位置 （./docs/knowledge，这里使用相对路径。因为配置服务器的时候已经配置的发送文件的位置）
- Exec command 输入发送完文件后要执行的命令 

```sh
$ cd /docker/webserver/static/docs/knowledge
$ tar xvf dist.tar
```

### 自动化构建

#### Github 上配置 Jenkins 的 webhook
- 进入代码仓库
- 选择 `Settings`
- 选择 `Webhooks`
- Payload URL 输入 `ip + jenkins端口/github-webhook/`
- Which events would you like to trigger this webhook? 选择 `Just the push event` 仅推送事件触发

#### Github 上生成一个 access token
- 进入 github 主页
- 右上角个人中心选择 `Settings`
- `Developer settings`
- `Tokens`
- `Generate new token`
- 保存生成后的 token

#### 修改 Jenkins 配置
##### 修改系统配置
- 系统管理
- 修改系统配置 Configure System
- Github
- Github Server
- 输入名称
- API URL 默认 `https://api.github.com`
- 添加凭据
- 类型选择 Secret text
- Secret 位置输入刚才生成的 Github Token
- 描述随便填
- 保存
- 选择刚才添加的凭据
- 保存

##### 修改工程配置
- 回到工程配置
- 构建触发器
- 选择 `GitHub hook trigger for GITScm polling`
- 构建环境
- 选择 `Use secret text(s) or file(s)`
- 凭据 指定凭据，选择刚才保存的 Secret text 凭据
- 保存

上述操作已经实现了推送代码触发 jenkins 构建事件
