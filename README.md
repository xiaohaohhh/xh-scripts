# xh_scripts

青龙面板脚本库，包含各类自动化脚本。

## 📦 拉取命令

在青龙面板中添加订阅：

```
ql repo https://github.com/xiaohaohhh/xh_scripts.git "xh_" "utils" "py|js"
```

或者单独拉取某个脚本：

```bash
ql raw https://raw.githubusercontent.com/xiaohaohhh/xh_scripts/main/zrgas/xh_gas_燃气查询.js
```

## 📁 目录结构

```
xh_scripts/
├── zrgas/                  # 燃气相关脚本
│   ├── xh_gas_燃气查询.js   # 中燃燃气查询脚本
│   └── config.sample.js    # 燃气查询配置示例文件
├── utils/                  # 工具函数库
│   ├── notify.js           # 通知模块 (JS版)
│   └── notify.py           # 通知模块 (Python版)
├── .gitignore              # Git忽略文件
└── README.md               # 说明文档
```

## 🔧 配置说明

本仓库脚本不使用青龙面板的环境变量进行全局配置，所有配置数据均存放于各个脚本的专属文件夹内。

### 1. 生成配置文件
进入对应的脚本文件夹（例如 `zrgas/`），复制 `config.sample.js` 并重命名为 `config.js`。

### 2. 填写配置数据
在生成的 `config.js` 内填入相关的敏感数据，例如 PushPlus 的 token 或卡号等信息。


## 📜 脚本列表

### 燃气查询 (`zrgas/xh_gas_燃气查询.js`)

- 功能：查询中燃燃气表余额
- 定时：每天查询一次
- 通知：余额低于30时发送提醒，低于10时发送紧急警告

**青龙定时规则：**
```
0 22 * * *
```

## 🔄 更新日志

### v1.0.0 (2026-02-21)
- 初始版本
- 添加燃气查询脚本
- 添加通知模块

## ⚠️ 免责声明

- 本仓库脚本仅供学习交流使用
- 请勿用于非法用途
- 使用本仓库脚本产生的任何问题，作者不承担任何责任
