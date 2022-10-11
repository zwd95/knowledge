# Docker

## 什么是 docker 

docker 可以看成是一个高性能的虚拟机，主要用于 linux 环境的虚拟化。开发者可以打包他们的应用以及依赖包到一个可以移植的容器中，然后发布到任何流行的 linux 机器上。容器完全使用沙箱机制，相互之间不会有任何接口

## docker 的优点

- 环境隔离
  - docker 实现了资源隔离，一台机器运行多个容器互无影响

- 更高效的资源利用
  - docker 容器的运行不需要额外的虚拟化管理程序的支持，他是内核级的虚拟化，可以实现更高的性能，同时对资源的额外需求很低

- 更快速的交付部署
  - 使用 docker，开发人员可以利用镜像快速构建一套标准的研发环境，开发完成后，测试和运维人员可以直接通过使用相同的环境来部署代码

- 更易迁移扩展
  - docker 容器几乎可以在任意的平台上运行，包括虚拟机、公有云、私有云、个人电脑、服务器等，这种兼容性让用户可以在不同平台之间轻松的迁移应用

- 更简单的更新管理
  - 使用 Dockerfile，只需要很少的配置修改，就可以替代以往大量的更新工作。并且所有修改都是以增量的方式进行分发和更新，从而实现自动化和高效的容器管理

## docker 安装

### centos 环境 

```sh
# 删除 docker
$ sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装 docker 相关工具
$ sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 配置镜像仓库地址
$ sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 docker 社区版
$ sudo yum install docker-ce docker-ce-cli containerd.io

# 启动 docker 
$ sudo systemctl start docker

# 运行 docker 
$ sudo docker run hello-world
```

### dockerfile

docker 使用 dockerfile 作为配置文件进行镜像的构建，简单看一个 node 应用构建的 dockerfile 

```yml
FROM node:12.0.0

WORKDIR /usr/app

COPY package*.json ./

RUN npm ci -gy

COPY ..

EXPOSE 3000

CMD ["npm", "start"]
```

```yml
# Dockerfile
FROM nginx

# 将 dist 文件中的内容复制到 /usr/share/nginx/html/ 这个目录下面
COPY dist/ /usr/share/nginx/html/

# 拷贝 nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 设置时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo 'Asia/Shanghai' >/etc/timezone

# 创建 /admin-access-log ，对应到 nginx.conf
# 启动 nginx 并使用 tail -f 模拟类似 pm2 的阻塞式进程
CMD touch /admin-access.log && nginx && tail -f /admin-access.log
```

- FROM
  - 基于这个 Image（镜像） 开始
- WORKDIR
  - 设置工作目录
- COPY
  - 复制文件
- RUN
  - 新层中执行命令
- EXPOSE
  - 声明容器的监听接口
- CMD
  - 容器启动时执行指令默认值

## docker 核心概念

### docker Image（镜像）

- 操作系统分为内核和用户空间。对于 linux 而言，内核启动后，会挂载 root 文件系统为其提供用户空间支持。而 docker 镜像 （Image）。就相当于是一个 root 文件系统 

- Docker 镜像是一个特殊的文件系统，除了提供容器运行时所需的程序、库、资源、配置等文件外，含了一些为运行时准备的一些配置参数（如匿名券、环境变量、用户等）。镜像不包含任何动态数据，其内容在构建之后也不会被改变

- Docker 设计时，就充分利用了 Union FS 的技术，将其设计为 分层存储的架构。镜像实际是由多层文件系统联合组成

- 镜像构建时，会一层一层构建，前一层是后一层的基础。每一层构建完就不会再发生改变，后一层上的任何改变只发生自己这一层

### docker container（容器）

- 镜像（Image）和容器（Container）的关系，就像是面向对象程序设计中的 类 和 实例一样，镜像是静态的定义，容器是镜像运行时的实体。容器可以被创建、启动、停止、删除、暂停等

- 容器的实质是进程，但与直接在宿主执行的进行不同，容器进行运行于属于自己的独立的命名空间。前面讲过镜像使用的是分层存储，容器也是如此

- 容器存储层的生命周期和容器一样，容器消亡时，容器存储层也随之消亡。因此，任何保存于容器存储层的信息都会随容器删除而丢失

- 按照 Docker 最佳实践的要求，容器不应该向其存储层写入任何数据，容器存储层要保持无状态化。所有的文件写入操作，都应该使用数据卷（Volume）、或者绑定宿主目录，在这些位置的读写会跳过容器存储层，直接对宿主（或网络存储）发生读写，其性能和稳定性更高。数据卷的生命周期独立于容器，容器消亡，数据卷不会消亡。因此，使用数据卷后，容器可以随意删除、重新 run，数据却不会丢失

### docker Repository（仓库）

- 镜像构建完成后，可以很容易的在当前宿主上运行，但是，如果需要在其他服务器上使用这个镜像，我们就需要一个集中的存储、分发镜像的服务，Docker Registry 就是这样的服务

- 一个 Docker Registry 可以包含多个仓库（Repository）；每个仓库可以包含多个标签 （Tag）；每个标签对应一个镜像。所以说：镜像仓库是 Docker 用来集中存放镜像文件的地方，类似于常用的代码仓库 （Git 等）

- 通常，一个仓库会包含一个软件不同版本的镜像，而标签就常用于对应该软件的各个版本。我们可以通过 `<仓库名>:<标签>` 的格式来指定具体是这个软件哪个版本的镜像。如果不给出标签，将以 latest 作为默认标签

### Docker Registry 公开服务 和 私有 Docker Registry

- Docker Registry 公开服务是开放给用户使用、允许用户管理镜像的 Registry 服务。一般这类公开服务允许用户免费上传、下载公开的镜像，并可能提供收费服务供用户管理私有镜像

- 最常使用的 Registry 公开服务是官方的 Docker Hub，这也是默认的 Registry，并拥有大量的高质量官方镜像网址为 `hub.docker.com`。在国内访问 Docker Hub 可能会比较慢，国内也有一些云服务商提供类似于 Docker Hub 的公开服务。比如 时速云镜像库、网易云镜像服务、阿里云镜像库等

- 除了使用公开服务外，用户还可以在本地搭建私有 Docker Registry。Docker 官方提供了 Docker Registry 镜像，可以直接使用作为私有 Registry 服务。开源的 Docker Registry 镜像只提供了 Docker Registry API 的服务端实现，足以支持 docker 命令，不影响使用，但不包含图形界面，以及镜像维护、用户管理、访问控制等高级功能

## docker 常用指令

### 镜像操作

| 功能        | 命令           |
| ------------- |:-------------:|
| 拉取镜像      | docker pull [镜像名称:版本] |
| 镜像列表      | docker images      |
| 删除镜像 | docker rmi [镜像名称:版本]      |
| 镜像操作记录      | docker history [镜像名称:版本] |
| 给镜像设置新的仓库      | docker tag [镜像名称:版本] [新镜像名称:新版本] |
| 查看镜像详细      | docker inspect [镜像名称：版本] |
| 搜索镜像      | docker search [关键字] |
| 仓库登陆      | docker login |

### 容器操作

| 功能        | 命令           |
| ------------- |:-------------:|
| 启动容器并进入      | docker run -ti --name [容器名称] [镜像名称:版本] bash |
| 容器列表      | docker ps -a      |
| 容器提交为新的镜像 | docker commit [容器名称] my_image:v1.0      |
| 容器后台运行      | docker run -d --name [容器名称] [镜像名称:版本] bash -c "echo hello world" |
| 容器结束后自动删除      | docker run --rm --name [容器名称] [镜像名称:版本] bash -c "echo hello world" |
| 删除容器      | docker rm [容器名称] |
| 进入容器 exec      | docker exec -ti [容器名称] bash |
| 停止容器     | docker stop [容器名称] |
| Docker 日志      | docker logs [容器名称] |
| 查看容器详细      | docker inspect [容器名称] |
| 查看容器最近一个进程      | docker top [容器名称] |
| 暂停一个容器进程      | docker pause [容器名称] |
| 取消暂停      | docker unpause [容器名称] |
| 终止容器      | docker kill [容器名称] |
| 端口映射      | docker run -ti --name [容器名称] -p 8080:80 [镜像名称:版本] bash |

### 内存限制

| 参数        | 简介           |
| ------------- |:-------------:|
| -m, - -memory      | 内存限制，格式：数字+单位，单位可以是 b, k, m, g，最小 4M |

### CPU 限制

| 参数        | 简介           |
| ------------- |:-------------:|
| -- -cpuset-cpus=""     | 允许使用的 CPU 集 |
| -c,- -cpu-shares=0     | CPU 共享权值 |

### dockerfile 指令

| 命令        | 说明           | 示例           |
| ------------- |:-------------:|:-------------:|
| FROM      | 基于这个 Image 开始 | FROM nginx:latest |
| ENV      | 环境变量 | ENV localfile /usr/local/nginx |
| RUN      | 新层中执行命令 | RUN /bin/bash -c 'source' HOME/.bashrc;echoHOME |
| LABEL      | 设置 metadata | LABEL version="1.0" |
| MAINTAINER      | 维护者（deprecated） | maintainer="xxxx@gmail.com" |
| EXPOSE      | 声明容器监听端口 | EXPOSE 80 443 |
| ADD      | 添加文件 | ADD ./dist ${foo}/html |
| COPY      | 复制文件 | COPY ./dist ${foo}/html |
| ENTRYPOINT      | 容器启动时执行指令 |  |
| CMD      | 容器启动时执行指令默认值 | CMD ["npm"] |
| WORKDIR      | 设置工作目录 | WORKDIR /path/to/workdir |
| VOLUME      | 挂载点 | VOLUME ["/data"] |
| USER      | 指定操作用户 | USER www |
