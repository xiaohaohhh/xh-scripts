/**
 * new Env("中燃燃气余额查询通知");
 * cron: 0 22 * * *
 * 
 * 燃气查询脚本 v4.1 - 桌面版
 * 功能：通过API查询燃气表的最新数据，并在余额低于30时发送通知
 * 作者：AI助手
 * 日期：2026-02-21
 * 更新：
 * - 适配桌面环境（Node.js）
 * - 集成 PushPlus 通知功能
 * - 余额低于30时发送通知，低于10时发送醒目警告
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { sendPushPlus } = require('../utils/notify');

// ==================== 配置区域 ====================
let userConfig = {};
try {
    userConfig = require('./config');
} catch (e) {
    // 忽略未找到配置文件的错误
}

const CONFIG = {
    // 仅使用代码配置，不使用青龙环境变量
    icCardCode: userConfig.GAS_IC_CARD_CODE || "",
    apiUrl: "https://zrds.95007.com/zrmgr_iot/meterInfo/queryLatestMeterInfo.do?",
    logPath: path.join(__dirname, "gas_query_log.txt"),
    
    // 通知配置
    pushPlusToken: userConfig.PUSH_PLUS_TOKEN || "",
    pushPlusTopic: userConfig.GAS_NOTIFY_TOPIC || "",
    balanceWarningThreshold: userConfig.GAS_WARNING_THRESHOLD || 30,
    balanceCriticalThreshold: userConfig.GAS_CRITICAL_THRESHOLD || 10
};

// ==================== 日志管理器 ====================
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
        
        if (level === "ERROR") {
            console.error(logMessage);
        } else if (level === "WARN") {
            console.warn(logMessage);
        } else {
            console.log(logMessage);
        }
        
        this.logs.push(logMessage);
    },
    
    saveToFile: function() {
        try {
            let logContent = this.logs.join("\n") + "\n" + "=".repeat(80) + "\n\n";
            
            if (fs.existsSync(CONFIG.logPath)) {
                fs.appendFileSync(CONFIG.logPath, logContent, 'utf8');
            } else {
                fs.writeFileSync(CONFIG.logPath, logContent, 'utf8');
            }
            
            console.log("日志已保存到: " + CONFIG.logPath);
            return true;
        } catch (error) {
            console.error("保存日志失败: " + error);
            return false;
        }
    }
};

// ==================== HTTP请求函数 ====================
function httpRequest(url, options) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = protocol.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// ==================== 主函数 ====================
async function main() {
    Logger.log("========== 燃气查询脚本启动 v4.1 ==========");
    Logger.log("开始查询燃气信息...");
    
    try {
        let result = await queryGasInfo();
        
        if (result) {
            Logger.log("========== 查询成功 ==========");
            displayGasInfo(result);
            
            // 检查余额并发送通知
            await checkBalanceAndNotify(result);
        } else {
            Logger.log("查询失败", "ERROR");
        }
        
    } catch (error) {
        Logger.log("程序执行出错：" + error, "ERROR");
        Logger.log("错误堆栈：" + error.stack, "ERROR");
    }
    
    Logger.log("========== 脚本执行完毕 ==========");
    //Logger.saveToFile();
}

// ==================== 查询燃气信息函数 ====================
async function queryGasInfo() {
    Logger.log("正在构造请求...");
    
    let requestBody = "icCardCode=" + CONFIG.icCardCode;
    
    Logger.log("请求URL: " + CONFIG.apiUrl);
    Logger.log("请求体: " + requestBody);
    Logger.log("发送请求中...");
    
    try {
        let response = await httpRequest(CONFIG.apiUrl, {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody
        });
        
        Logger.log("响应状态码: " + response.statusCode);
        
        if (response.statusCode !== 200) {
            Logger.log("HTTP请求失败，状态码: " + response.statusCode, "ERROR");
            return null;
        }
        
        Logger.log("原始响应: " + response.body);
        
        let jsonData = JSON.parse(response.body);
        
        if (jsonData.status === "1") {
            Logger.log("✓ 查询成功: " + jsonData.msg);
            return jsonData.data;
        } else {
            Logger.log("✗ 查询失败: " + jsonData.msg, "ERROR");
            return null;
        }
        
    } catch (error) {
        Logger.log("请求异常: " + error, "ERROR");
        return null;
    }
}

// ==================== 显示燃气信息函数 ====================
function displayGasInfo(data) {
    Logger.log("\n========== 燃气表信息 ==========");
    
    if (data.dataTime) {
        Logger.log("📅 数据时间: " + data.dataTime);
    }
    
    if (data.gas !== null && data.gas !== undefined) {
        Logger.log("🔢 累计用气: " + data.gas + " m³");
    }
    
    if (data.effeGas !== null && data.effeGas !== undefined) {
        Logger.log("⛽ 本次用气: " + data.effeGas + " m³");
    }
    
    if (data.custCode) {
        Logger.log("👤 客户编号: " + data.custCode);
    }
    
    if (data.valveStateStr) {
        Logger.log("🚪 阀门状态: " + data.valveStateStr);
    }
    
    if (data.volt) {
        Logger.log("🔋 电池电压: " + data.volt + " V");
    }
    
    Logger.log("==================================\n");
    
    console.log("\n✅ 查询成功！累计: " + data.gas + "m³\n");
}

// ==================== 余额检查与通知函数 ====================
async function checkBalanceAndNotify(data) {
    // 获取余额（effeGas）
    const balance = parseFloat(data.effeGas);
    
    if (isNaN(balance)) {
        Logger.log("无法解析余额数据，跳过通知", "WARN");
        return;
    }
    
    Logger.log(`当前余额: ${balance} m³`);
    
    // 判断是否需要发送通知
    if (balance >= CONFIG.balanceWarningThreshold) {
        Logger.log("余额充足，无需发送通知");
        return;
    }
    
    // 余额低于阈值，准备发送通知
    let title, content, isCritical;
    
    if (balance < CONFIG.balanceCriticalThreshold) {
        // 严重警告（余额低于10）
        isCritical = true;
        title = "🚨🚨🚨 燃气余额严重不足！";
        content = `
<div style="background-color: #ff4444; color: white; padding: 20px; border-radius: 10px; font-size: 18px;">
    <h1 style="color: white; text-align: center;">⚠️ 紧急警告 ⚠️</h1>
    <h2 style="color: white; text-align: center;">燃气余额严重不足！</h2>
    <hr style="border-color: white;">
    <p style="font-size: 24px; font-weight: bold; text-align: center;">
        当前余额: <span style="font-size: 32px;">${balance}</span> m³
    </p>
    <p style="text-align: center; font-size: 16px;">
        ⚠️ 余额已低于 ${CONFIG.balanceCriticalThreshold} m³<br>
        🔥 请立即充值，避免停气！
    </p>
    <hr style="border-color: white;">
    <p style="font-size: 14px;">
        📅 查询时间: ${data.dataTime || new Date().toLocaleString('zh-CN')}<br>
        👤 客户编号: ${data.custCode || 'N/A'}<br>
        🔢 累计用气: ${data.gas || 'N/A'} m³<br>
        🚪 阀门状态: ${data.valveStateStr || 'N/A'}<br>
        🔋 电池电压: ${data.volt || 'N/A'} V
    </p>
</div>
        `.trim();
        
        Logger.log("⚠️ 余额严重不足，发送醒目警告通知", "WARN");
        
    } else {
        // 普通警告（余额低于30但高于10）
        isCritical = false;
        title = "⚠️ 燃气余额不足提醒";
        content = `
<div style="background-color: #ff9800; color: white; padding: 15px; border-radius: 8px;">
    <h2 style="color: white; text-align: center;">燃气余额提醒</h2>
    <hr style="border-color: white;">
    <p style="font-size: 20px; font-weight: bold; text-align: center;">
        当前余额: <span style="font-size: 28px;">${balance}</span> m³
    </p>
    <p style="text-align: center;">
        余额已低于 ${CONFIG.balanceWarningThreshold} m³<br>
        建议尽快充值
    </p>
    <hr style="border-color: white;">
    <p style="font-size: 13px;">
        📅 查询时间: ${data.dataTime || new Date().toLocaleString('zh-CN')}<br>
        👤 客户编号: ${data.custCode || 'N/A'}<br>
        🔢 累计用气: ${data.gas || 'N/A'} m³<br>
        🚪 阀门状态: ${data.valveStateStr || 'N/A'}<br>
        🔋 电池电压: ${data.volt || 'N/A'} V
    </p>
</div>
        `.trim();
        
        Logger.log("⚠️ 余额不足，发送提醒通知", "WARN");
    }
    
    // 发送 PushPlus 通知到指定群组
    try {
        await sendPushPlus(title, content, {
            token: CONFIG.pushPlusToken,
            topic: CONFIG.pushPlusTopic,
            template: "html"
        });
        Logger.log(`✓ 通知已发送到群组 ${CONFIG.pushPlusTopic}`);
    } catch (error) {
        Logger.log(`✗ 通知发送失败: ${error.message}`, "ERROR");
    }
}

// ==================== 执行 ====================
main().catch(error => {
    console.error("未捕获的错误:", error);
    process.exit(1);
});

