# Rosmarinus

![language-typescript](https://img.shields.io/badge/language-typescript-3178c6)

一个用于 [Screeps](https://screeps.com/) 的 TypeScript 半自动脚本。基本的房间运营均可自动，其他功能则通过旗帜控制。

本项目的框架与部分功能参考自 [Xscreeps](https://gitee.com/mikebraton/xscreeps)

性能分析模块来自于 [Screeps Profiler](https://github.com/screepers/screeps-profiler)

用到的轮子：极致建筑缓存、超级移动优化

## 注意

本项目可能还有会导致报错的BUG, 还在慢慢修。


## 功能

- 基本房间运营的自动化（孵化、采集、升级、建造、维修）
- 自动填充能量与资源
- 自动添加建筑工地
- 半自动lab合成（手动设置后会合成到原料不足）
- 半自动factory生产（手动设置后会生产到原料不足）
- 全自动lab合成任务（根据设定的任务表自动分配合成任务）
- 全自动factory生产任务（根据设定的任务表自动分配生产任务）

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


