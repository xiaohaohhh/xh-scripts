/**
 * 配置示例文件
 * 使用方法：复制此文件为 config.js，然后填写你的配置
 */

module.exports = {
    // ==================== 通知配置 ====================
    
    // 企业微信机器人 Webhook 地址
    WECHAT_WEBHOOK: '',

    // Server酱的 PUSH_KEY (兼容 Turbo 版)
    SERVERCHAN_KEY: '',

    // Bark 设备码或URL, 例: https://api.day.app/DxHcxxxxxRxxxxxxcm/
    BARK_URL: '',

    // PushPlus 配置
    PUSH_PLUS_TOKEN: '',              // pushplus 推送 token
    PUSH_PLUS_USER: '',               // pushplus 推送的群组编码 (可选)
    PUSH_PLUS_TEMPLATE: 'html',       // pushplus 发送模板，支持html,txt,json,markdown
    PUSH_PLUS_CHANNEL: 'wechat',      // pushplus 发送渠道，支持wechat,webhook,cp,mail,sms

    // 邮件 SMTP 配置
    MAIL_HOST: '',                    // SMTP 服务器地址, 如 smtp.qq.com
    MAIL_PORT: 465,                   // SMTP 服务器端口, SSL一般为465, 普通为25
    MAIL_USER: '',                    // 邮箱账号
    MAIL_PASS: '',                    // 邮箱密码或授权码
    MAIL_TO: '',                      // 收件人邮箱, 多个用英文逗号,隔开

    // ==================== 燃气查询配置 ====================
    
    // 中燃燃气 IC 卡号
    GAS_IC_CARD_CODE: '',
    
    // 余额警告阈值
    GAS_WARNING_THRESHOLD: 30,        // 低于此值发送普通提醒
    GAS_CRITICAL_THRESHOLD: 10,       // 低于此值发送紧急警告
    
    // 通知群组
    GAS_NOTIFY_TOPIC: ''              // PushPlus 群组编码
};
