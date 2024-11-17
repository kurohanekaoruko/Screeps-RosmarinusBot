# Rosmarinus-Bot

![language-javascript](https://img.shields.io/badge/language-javascript-3178c6)
![language-typescript](https://img.shields.io/badge/language-typescript-3178c6)

一个用于 [Screeps](https://screeps.com/) 的 JavaScript/TypeScript 脚本，半自动。基本的房间运营为自动（但是建筑需要手动添加），其他功能则通过旗帜控制。

本项目的框架与部分功能参考自 [Xscreeps](https://gitee.com/mikebraton/xscreeps)

性能分析模块来自于 [Screeps Profiler](https://github.com/screepers/screeps-profiler)

用到的轮子：极致建筑缓存、超级移动优化

## 功能

- 基本房间运营的自动化（孵化、采集、升级、建造、维修）
- 自动填充能量与资源
- 自动添加建筑工地
- 自动lab合成
- 自动factory生产

## 使用方法

在控制台输入 `help` 查看 (还没写)

## 安装

1. 安装依赖

    ```bash
    npm install
    ```

2. 配置

    创建 `.secret.json` 文件，并添加以下内容：

    ```json
    {
        "main": {
            "token": "这里是token",
            "protocol": "https",
            "hostname": "screeps.com",
            "port": 443,
            "path": "/",
            "branch": "main"
        },
        "local": {  // 可选
            "copyPath": "游戏客户端放代码的本地路径"
        }
    }
    ```

3. 构建

    ```bash
    npm run build
    ```

    生成的 js 文件在 `dist` 目录下

4. 构建并提交代码

    ```bash
    npm run push
    ```

    注意, 这将会覆盖 `main` 分支的代码。

    在游戏内切换到 `main` 分支即可开始运行。如果切换分支后报错，那么就再执行一次 `npm run push`。


