# AGENTS.md - 青龙面板脚本库开发指南

本文档为 AI 编码助手提供项目规范和开发指南。

## 项目概述

**项目类型**: 青龙面板自动化脚本库  
**主要语言**: JavaScript (Node.js) + Python  
**用途**: 自动化任务脚本，包括燃气查询、通知推送等功能  
**运行环境**: 青龙面板 / 本地 Node.js / Python 环境

## 目录结构

```
xh_scripts/
├── zrgas/                    # 燃气相关脚本
│   ├── xh_gas_燃气查询.js     # 中燃燃气查询脚本
│   └── config.sample.js      # 配置示例文件
├── utils/                    # 工具函数库
│   ├── notify.js             # 通知模块 (JavaScript)
│   └── notify.py             # 通知模块 (Python)
├── .gitignore                # Git 忽略文件
├── README.md                 # 项目说明文档
└── AGENTS.md                 # 本文件
```

## 运行和测试命令

### JavaScript 脚本

```bash
# 运行燃气查询脚本
node zrgas/xh_gas_燃气查询.js

# 测试通知模块
node utils/notify.js
```

### Python 脚本

```bash
# 测试 Python 通知模块
python utils/notify.py
# 或
python3 utils/notify.py
```

### 青龙面板定时规则

```bash
# 每天晚上 22:00 执行燃气查询
0 22 * * *

# 国内服务器建议拉取仓库命令（使用代理）
ql repo https://ghproxy.imciel.com/https://github.com/xiaohaohhh/xh-scripts.git "gas_|jd_|sign_" "utils" "py|js"

# 国外服务器拉取仓库命令
ql repo https://github.com/xiaohaohhh/xh-scripts.git "gas_|jd_|sign_" "utils" "py|js"
```

## 代码风格规范

### JavaScript 规范

#### 1. 文件头注释
每个脚本文件必须包含详细的文件头注释：

```javascript
/**
 * 脚本名称 vX.X - 环境说明
 * 功能：简要描述脚本功能
 * 作者：作者名
 * 日期：YYYY-MM-DD
 * 更新：
 * - 更新说明1
 * - 更新说明2
 */
```

#### 2. 模块导入
按以下顺序组织导入：
1. Node.js 内置模块
2. 第三方模块
3. 本地模块

```javascript
// Node.js 内置模块
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 第三方模块
// const axios = require('axios');

// 本地模块
const { sendPushPlus } = require('../utils/notify');
```

#### 3. 配置管理
使用 `CONFIG` 对象集中管理配置：

```javascript
const CONFIG = {
    apiUrl: "https://example.com/api",
    logPath: path.join(__dirname, "log.txt"),
    threshold: 30
};
```

#### 4. 命名约定
- **常量**: 全大写下划线分隔 (`PUSH_PLUS_TOKEN`)
- **变量/函数**: 小驼峰 (`sendPushPlus`, `queryGasInfo`)
- **对象/类**: 大驼峰 (`Logger`, `CONFIG`)

#### 5. 函数结构
使用 `async/await` 处理异步操作，避免回调地狱：

```javascript
async function main() {
    try {
        let result = await queryGasInfo();
        if (result) {
            await processResult(result);
        }
    } catch (error) {
        Logger.log("错误：" + error, "ERROR");
    }
}
```

#### 6. 错误处理
- 使用 `try/catch` 包裹异步操作
- 记录详细错误信息和堆栈
- 区分错误级别：`ERROR`, `WARN`, `INFO`

```javascript
try {
    let response = await httpRequest(url, options);
} catch (error) {
    Logger.log("请求异常: " + error, "ERROR");
    Logger.log("错误堆栈：" + error.stack, "ERROR");
    return null;
}
```

#### 7. 日志记录
使用统一的 `Logger` 对象：

```javascript
const Logger = {
    logs: [],
    log: function(message, level) {
        level = level || "INFO";
        let timestamp = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        let logMessage = `[${timestamp}] [${level}] ${message}`;
        console.log(logMessage);
        this.logs.push(logMessage);
    }
};
```

### Python 规范

#### 1. 文件头注释
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
模块名称

功能描述
支持的特性列表

使用方式：
示例代码
"""
```

#### 2. 导入顺序
1. 标准库
2. 第三方库
3. 本地模块

```python
# 标准库
import json
import smtplib
from email.mime.text import MIMEText
from urllib.parse import quote

# 第三方库
import requests

# 本地模块
# from config import settings
```

#### 3. 命名约定
- **常量**: 全大写下划线分隔 (`PUSH_PLUS_TOKEN`)
- **变量/函数**: 小写下划线分隔 (`send_pushplus`, `query_gas_info`)
- **类**: 大驼峰 (`NotificationManager`)
- **私有变量**: 单下划线前缀 (`_internal_var`)

#### 4. 函数文档字符串
使用 Google 风格的 docstring：

```python
def send_pushplus(title, content, token=None, topic=None):
    """
    PushPlus推送
    
    Args:
        title: 标题
        content: 内容
        token: 自定义token（可选）
        topic: 群组编码（可选）
    """
```

#### 5. 错误处理
```python
try:
    response = requests.post(url, json=data, timeout=10)
    print(f'[通知] 返回: {response.text}')
except Exception as error:
    print(f'[通知] 发送失败: {error}')
```

## 通用开发规范

### 1. 敏感信息处理
- **禁止硬编码**: 不得在代码中硬编码 token、密码等敏感信息
- **使用配置文件**: 敏感信息应放在对应脚本目录的 `config.js` 中
- **示例文件**: 提供 `config.sample.js` 作为配置模板
- **Git 忽略**: 确保 `config.js` 等文件在 `.gitignore` 中

### 2. 通知功能
- 支持多种通知渠道：企业微信、Server酱、Bark、PushPlus、邮件
- 使用 `utils/notify.js` 或 `utils/notify.py` 统一通知接口
- 通知内容支持 HTML 格式（PushPlus 和邮件）

### 3. 日志管理
- 所有脚本必须包含日志记录功能
- 日志格式：`[时间戳] [级别] 消息内容`
- 日志级别：`INFO`, `WARN`, `ERROR`
- 可选保存到文件（默认注释掉，避免日志堆积）

### 4. HTTP 请求
- 设置合理的超时时间（建议 10 秒）
- 处理网络异常和超时
- 记录请求和响应详情便于调试

### 5. 代码注释
- 使用中文注释
- 关键逻辑必须添加注释
- 使用分隔线组织代码块：

```javascript
// ==================== 配置区域 ====================
// ==================== 主函数 ====================
// ==================== 工具函数 ====================
```

### 6. 版本管理
- 脚本文件头注明版本号
- 重大更新时更新版本号和更新日志
- 在 README.md 中维护更新日志

## 验证和测试

### 修改代码后必须执行

1. **语法检查**: 确保代码可以正常运行
   ```bash
   node <script>.js  # JavaScript
   python <script>.py  # Python
   ```

2. **功能测试**: 验证核心功能是否正常
   - 测试 API 请求是否成功
   - 测试通知是否发送
   - 测试错误处理是否生效

3. **日志检查**: 确认日志输出格式正确且信息完整

## 常见任务模式

### 添加新脚本
1. 在对应目录创建脚本文件（`zrgas/`, `jd/`, `sign/` 等）
2. 添加完整的文件头注释
3. 实现核心功能
4. 集成通知模块
5. 添加日志记录
6. 更新 README.md

### 修改现有脚本
1. 阅读现有代码，理解逻辑
2. 保持现有代码风格
3. 更新版本号和更新日志
4. 测试修改后的功能
5. 更新相关文档

### 添加通知渠道
1. 在 `utils/notify.js` 和 `utils/notify.py` 中添加新函数
2. 在 `config.sample.js` 中添加配置项
3. 更新 README.md 的通知配置说明
4. 提供使用示例

## 注意事项

- **不要提交敏感信息**: 检查 `.gitignore` 确保配置文件不被提交
- **保持向后兼容**: 修改现有功能时考虑兼容性
- **测试后再提交**: 确保代码在本地测试通过
- **遵循现有模式**: 新代码应与现有代码风格保持一致
- **中文友好**: 日志、注释、文档使用中文，便于阅读

## 配置文件支持

脚本使用本地独立配置文件进行参数管理。所有的配置均存放于各个业务脚本专属文件夹内：

1. 复制业务目录（如 `zrgas`）下的 `config.sample.js` 并重命名为 `config.js`。
2. 填入真实通知 token、卡号等数据。
3. `config.js` 被 `.gitignore` 保护，不会泄露到远端。

---

**最后更新**: 2026-02-21  
**文档版本**: 1.1
