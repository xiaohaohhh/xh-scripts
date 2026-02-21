/**
 * 通用通知模块
 * 支持:
 * - 企业微信机器人
 * - Server酱
 * - Bark 推送
 * - PushPlus (Push+)
 * - 邮件 SMTP
 * 
 * 使用方式:
 * const { send, sendPushPlus } = require('./notify');
 * 
 * // 方式1: 使用默认配置发送所有渠道
 * await send("标题", "内容");
 * 
 * // 方式2: 只发送 PushPlus，使用默认配置
 * await sendPushPlus("标题", "内容");
 * 
 * // 方式3: 发送到指定群组
 * await sendPushPlus("标题", "内容", { topic: "group123" });
 * 
 * // 方式4: 自定义更多参数
 * await sendPushPlus("标题", "内容", {
 *     topic: "group123",
 *     template: "markdown",
 *     channel: "webhook"
 * });
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// =======================================
// =========== 默认配置区域 ================
// =======================================
// 公共通知模块不直接读取某个特定目录的 config.js。
// 请在调用各个发送函数时，通过 options 参数传入 token 等配置。
const push_config = {
    // 企业微信机器人 Webhook 地址
    WECHAT_WEBHOOK: '',

    // Server酱的 PUSH_KEY (兼容 Turbo 版)
    SERVERCHAN_KEY: '',

    // Bark 设备码或URL, 例: https://api.day.app/DxHcxxxxxRxxxxxxcm/
    BARK_URL: '',

    // PushPlus 配置
    PUSH_PLUS_TOKEN: '',
    PUSH_PLUS_USER: '',               // pushplus 推送的群组编码 (可选)
    PUSH_PLUS_TEMPLATE: 'html',       // pushplus 发送模板，支持html,txt,json,markdown
    PUSH_PLUS_CHANNEL: 'wechat',      // pushplus 发送渠道，支持wechat,webhook,cp,mail,sms

    // 邮件 SMTP 配置
    MAIL_HOST: '',                    // SMTP 服务器地址, 如 smtp.qq.com
    MAIL_PORT: 465,                   // SMTP 服务器端口, SSL一般为465, 普通为25
    MAIL_USER: '',                    // 邮箱账号
    MAIL_PASS: '',                    // 邮箱密码或授权码
    MAIL_TO: ''                       // 收件人邮箱, 多个用英文逗号,隔开
};
// =======================================
// ===========  配置加载结束  =============
// =======================================

/**
 * HTTP/HTTPS 请求封装
 */
function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: options.timeout || 10000
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
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}


/**
 * PushPlus推送
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @param {object} options - 可选参数
 * @param {string} options.token - 自定义token
 * @param {string} options.topic - 群组编码（发送到指定群组）
 * @param {string} options.template - 发送模板 (html/txt/json/markdown)
 * @param {string} options.channel - 发送渠道 (wechat/webhook/cp/mail/sms)
 */
async function sendPushPlus(title, content, options = {}) {
    const token = options.token || push_config.PUSH_PLUS_TOKEN;
    if (!token) {
        throw new Error('PushPlus token 未配置，请在 notify.js 中设置 PUSH_PLUS_TOKEN 或通过参数传入');
    }
    
    const url = 'https://www.pushplus.plus/send';
    const data = JSON.stringify({
        token: token,
        title: title,
        content: content,
        topic: options.topic || push_config.PUSH_PLUS_USER,
        template: options.template || push_config.PUSH_PLUS_TEMPLATE,
        channel: options.channel || push_config.PUSH_PLUS_CHANNEL
    });
    
    const response = await httpRequest(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        },
        body: data
    });
    
    const result = JSON.parse(response.body);
    
    if (result.code === 200) {
        console.log('[通知] PushPlus 推送成功');
        return true;
    } else {
        throw new Error(`PushPlus API 返回错误: ${result.msg || '未知错误'}`);
    }
}

/**
 * 企业微信机器人推送
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @param {object} options - 可选参数 { webhook: '自定义webhook地址' }
 */
async function sendWeChat(title, content, options = {}) {
    const webhook = options.webhook || push_config.WECHAT_WEBHOOK;
    if (!webhook) return;
    
    try {
        const content_wechat = content.replace(/<br>/g, '\n');
        const data = JSON.stringify({
            msgtype: "text",
            text: {
                content: `${title}\n\n${content_wechat}`
            }
        });
        
        const response = await httpRequest(webhook, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            body: data
        });
        
        console.log('[通知] 企业微信返回:', response.body);
    } catch (error) {
        console.log('[通知] 企业微信发送失败:', error.message);
    }
}

/**
 * Server酱推送
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @param {object} options - 可选参数 { key: '自定义key' }
 */
async function sendServerChan(title, content, options = {}) {
    const key = options.key || push_config.SERVERCHAN_KEY;
    if (!key) return;
    
    try {
        const content_serverchan = content.replace(/<br>/g, '\n\n');
        const url = `https://sctapi.ftqq.com/${key}.send`;
        
        const params = new URLSearchParams({
            title: title,
            desp: content_serverchan
        });
        
        const response = await httpRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(params.toString())
            },
            body: params.toString()
        });
        
        console.log('[通知] Server酱返回:', response.body);
    } catch (error) {
        console.log('[通知] Server酱发送失败:', error.message);
    }
}

/**
 * Bark推送
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @param {object} options - 可选参数 { url: '自定义Bark URL' }
 */
async function sendBark(title, content, options = {}) {
    const barkUrl = options.url || push_config.BARK_URL;
    if (!barkUrl) return;
    
    try {
        const content_bark = content.replace(/<br>/g, '\n');
        const encodedTitle = encodeURIComponent(title);
        const encodedContent = encodeURIComponent(content_bark);
        
        const url = `${barkUrl}/${encodedTitle}/${encodedContent}`;
        const response = await httpRequest(url, { method: 'GET' });
        
        console.log('[通知] Bark返回:', response.body);
    } catch (error) {
        console.log('[通知] Bark发送失败:', error.message);
    }
}

/**
 * 邮件SMTP推送
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @param {object} options - 可选参数
 * @param {string} options.host - SMTP服务器地址
 * @param {number} options.port - SMTP端口
 * @param {string} options.user - 邮箱账号
 * @param {string} options.pass - 邮箱密码
 * @param {string} options.to - 收件人邮箱
 */
async function sendMail(title, content, options = {}) {
    const mailConfig = {
        host: options.host || push_config.MAIL_HOST,
        port: options.port || push_config.MAIL_PORT,
        user: options.user || push_config.MAIL_USER,
        pass: options.pass || push_config.MAIL_PASS,
        to: options.to || push_config.MAIL_TO
    };
    
    if (!mailConfig.host || !mailConfig.port || !mailConfig.user || !mailConfig.pass || !mailConfig.to) {
        return;
    }
    
    try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
            host: mailConfig.host,
            port: mailConfig.port,
            secure: mailConfig.port === 465,
            auth: {
                user: mailConfig.user,
                pass: mailConfig.pass
            }
        });
        
        await transporter.sendMail({
            from: mailConfig.user,
            to: mailConfig.to,
            subject: title,
            html: content
        });
        
        console.log('[通知] 邮件发送成功');
    } catch (error) {
        console.log('[通知] 邮件发送失败:', error.message);
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('[通知] 提示: 邮件功能需要安装 nodemailer: npm install nodemailer');
        }
    }
}

/**
 * 主发送函数 - 根据配置发送通知到所有渠道
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @param {object} options - 可选参数（会传递给各个推送函数）
 */
async function send(title, content, options = {}) {
    // 确保标题和内容是字符串
    title = String(title);
    // 为了兼容PushPlus和邮件，默认将换行符转为<br>
    const content_html = String(content).replace(/\n/g, '<br>');
    
    // 并行发送所有配置的通知渠道
    await Promise.all([
        sendWeChat(title, content_html, options),
        sendServerChan(title, content_html, options),
        sendBark(title, content_html, options),
        sendPushPlus(title, content_html, options),
        sendMail(title, content_html, options)
    ]);
    
    console.log('[通知] 所有推送任务已完成');
}

// 导出所有函数
module.exports = { 
    send,
    sendWeChat,
    sendServerChan,
    sendBark,
    sendPushPlus,
    sendMail
};
