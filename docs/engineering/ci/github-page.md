# 基于 GitHub Actions 将静态文档部署到 Github Pages

## Github Actions 是什么

GithubActions 是 Github 提供的持续集成服务。Github 提供一台虚拟的服务器实例，在此实例中可以通过自定义的 Actions 执行命令，实现构建代码、测试代码、打包代码、发布代码、部署代码等操作

[marketplace](https://github.com/marketplace?type=actions) 提供了大量 Github 官方与 第三方 Actions

actions 由以下部分组成

- workflow：工作流程，（一个完整的持续集成服务）
- job：任务，n 个 job 组成一个 workflow，一次持续集成服务的运行可完成多个 job
- step：步骤，n 个 step 组成一个 job，里面的 step 按照编写顺序运行
- action：动作，n 个 action 组成一个 step

## 配置文件

Github Actions 的配置文件必须存放到项目根目录 .github/workflows 文件夹下面。并且以 name.yml 的形式命名（name 自定义）

配置文件中常见字段

on 表示触发事件

```yml
# 触发条件，当 master 分之有 push 提交后
on:
  push:
    branches:
      - master
```

job 任务列表相关字段

- name：任务名称
- runs-on：虚拟机环境，可选 ubuntu-latest/windows-latest/macos-latest
- needs：执行任务的依赖顺序
- steps：执行步骤，每个任务可将需要执行的内容划分为不同步骤
    - name：步骤名称
    - uses：官方与第三方 Actions
    - with：Actions 入参
    - run：环境执行命令 shell命令
    - env：环境变量

```yml
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      # 拉取代码
      - name: Checkout
        uses: actions/checkout@v2
      # 安装依赖和打包文件
      - name: Install and Build
        run: npm install && npm run Build
```

### 基于 Github Actions 部署一个静态站点

### Github Token and Actions Secrets

首先创建 GitHub Token。进入 github.com，右上角进入 settings 配置页面，选择侧边栏 Developer settings，点击 Personal access tokens，点击 Generate new token

输入 Note，譬如 TOKEN，Expiration 选择 no expiration (永久)，select scopes 选择 repo 和 workflow。确认无误后点击 Generate Token，生成一个 TOKEN（生成完之后记得复制，因为页面关闭之后无法再查看生成的 TOKEN）

创建 Actions Secrets。进入项目仓库，点击 Settings 导航栏，点击 Secrets 的 Actions，点击 New repository secret 

在 Name 中输入 秘钥名称（Token），在 Value 上粘贴刚才生成的 TOKEN，确认无误后点击 Add Secret，生成一个 Actions Secret 

### gh-pages 分支

Github 创建 gh-pages 分支后会自动部署 Github Pages 上，所以利用该特性把生成的静态文件提交到 gh-pages 分支上就可以通过 Github Pages 自动生成静态站点

该操作无需手动，后面交由第三方 Actions 帮助你将代码推送到 gh-pages 分支上。要是 Github Pages 生效，还需要进行一些配置

进入仓库，点击 Settings，点击 Pages，点击 Branch，选择 gh-pages（第一次创建没有该分支，执行一次 ci 操作之后，第三方 Actions 会自动帮你新建一个 gh-pages 分支并提交）。会有 root 与 docs 两个文件夹选项，若把文档文件放到 docs 文件夹中，则选择 docs，否则全部清空选择 root

点击 Save，就会通过 Github Pages 自动生成静态站点了

```
https://<username>.github.io/<repository>
```

### 配置 ci.yml

在项目的根目录下创建 .github/workflows 文件夹。在 workflows 文件下创建一个 ci.yml 文件。文件内容如下

```yml
name: CI
on:
  push:
    branches:
      - master
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Install And Build
        run: npm install && npm run build
      - name: DeployGP
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.TOKEN }}
          publish_dir: ./dist
```

步骤解释

- Checkout：检出代码，使仓库代码保持最新的状态
- Install And Build：安装依赖和构建文件
- DeployGP：部署文件到 Github Pages

actions/checkout@v2 是官方 Actions，用于自动检出最新代码

actions-gh-pages 是一个第三方 Actions，用于自动部署代码到 Github Pages。入参使用 with 配置，[配置列表](https://github.com/peaceiris/actions-gh-pages#options)

目前为止，基本步骤已全部完成，每次将代码提交到仓库的时候，就会自动触发 ci.yml 脚本。打开仓库，点击 Actions，就能看到全部 workflows

Tip：Github 的私有仓库，无法直接部署到 github pages 使用，需要升级服务或者将仓库设为 public

## 使用 Github Actions 部署到阿里云服务器

### 配置文件

```yml
name: CI
on:
  push:
    branches:
      - master
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Install And Build
        run: npm install && npm run build
      - name: DeployGP
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.TOKEN }}
          publish_dir: ./dist
      - name: DeployECS
        uses: easingthemes/ssh-deploy@v2
        env:
          ARGS: '-avz --delete'
          SSH_PRIVATE_KEY: ${{ secrets.ECS_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.ECS_HOST }}
          REMOTE_USER: ${{ secrets.ECS_USER }}
          SOURCE: dist
          TARGET: /data/apps/docs
```

ssh-deploy@v3 是一个第三方 Actions，用于自动部署代码到服务器。入参使用 env 进行配置，[配置列表](https://github.com/easingthemes/ssh-deploy#configuration)

- SSH_PRIVATE_KEY：SSH 秘钥，登陆服务器后可执行 ssh-keygen -m PEM -t rsa -b 4096 生成，执行 cat /root/.ssh/id_rsa 查看秘钥
- REMOTE_HOST：服务器地址
- REMOTE_USER：服务器用户
- SOURCE：复制到阿里云服务器的文件夹名称
- TARGET：dist 文件夹将放在 /data/apps/doc 

在项目仓库 Settings -> Secrets -> Actions -> New repository secret 添加 ECS_PRIVATE_KEY ECS_HOST ECS_USER 环境变量
