#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通用通知模块 v2.0
支持:
- 企业微信机器人
- Server酱
- Bark 推送
- PushPlus (Push+)
- 邮件 SMTP

使用方式:
from notify_v2 import send, send_pushplus

# 方式1: 使用默认配置发送所有渠道
send("标题", "内容")

# 方式2: 只发送 PushPlus，使用默认配置
send_pushplus("标题", "内容")

# 方式3: 发送到指定群组
send_pushplus("标题", "内容", topic="group123")

# 方式4: 自定义更多参数
send_pushplus("标题", "内容", topic="group123", template="markdown", channel="webhook")
"""

import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import quote
import json

# =======================================
# =========== 默认配置区域 ================
# =======================================
# 公共通知模块不直接读取某个特定目录的 config.js/py。
# 请在调用各个发送函数时，通过参数传入 token 等配置。
push_config = {
    'WECHAT_WEBHOOK': '',
    'SERVERCHAN_KEY': '',
    'BARK_URL': '',
    
    'PUSH_PLUS_TOKEN': '',
    'PUSH_PLUS_USER': '',
    'PUSH_PLUS_TEMPLATE': 'html',
    'PUSH_PLUS_CHANNEL': 'wechat',
    
    'MAIL_HOST': '',
    'MAIL_PORT': 465,
    'MAIL_USER': '',
    'MAIL_PASS': '',
    'MAIL_TO': ''
}
# =======================================
# ===========  配置加载结束  =============
# =======================================


def send_wechat(title, content, webhook=None):
    """
    企业微信机器人推送
    
    Args:
        title: 标题
        content: 内容
        webhook: 自定义webhook地址（可选）
    """
    webhook_url = webhook or push_config['WECHAT_WEBHOOK']
    if not webhook_url:
        return
    
    try:
        content_wechat = content.replace('<br>', '\n')
        data = {
            "msgtype": "text",
            "text": {
                "content": f"{title}\n\n{content_wechat}"
            }
        }
        
        response = requests.post(
            webhook_url,
            json=data,
            timeout=10
        )
        
        print(f'[通知] 企业微信返回: {response.text}')
    except Exception as error:
        print(f'[通知] 企业微信发送失败: {error}')


def send_serverchan(title, content, key=None):
    """
    Server酱推送
    
    Args:
        title: 标题
        content: 内容
        key: 自定义key（可选）
    """
    serverchan_key = key or push_config['SERVERCHAN_KEY']
    if not serverchan_key:
        return
    
    try:
        content_serverchan = content.replace('<br>', '\n\n')
        url = f'https://sctapi.ftqq.com/{serverchan_key}.send'
        
        data = {
            'title': title,
            'desp': content_serverchan
        }
        
        response = requests.post(
            url,
            data=data,
            timeout=10
        )
        
        print(f'[通知] Server酱返回: {response.text}')
    except Exception as error:
        print(f'[通知] Server酱发送失败: {error}')


def send_bark(title, content, url=None):
    """
    Bark推送
    
    Args:
        title: 标题
        content: 内容
        url: 自定义Bark URL（可选）
    """
    bark_url = url or push_config['BARK_URL']
    if not bark_url:
        return
    
    try:
        content_bark = content.replace('<br>', '\n')
        encoded_title = quote(title)
        encoded_content = quote(content_bark)
        
        full_url = f'{bark_url}/{encoded_title}/{encoded_content}'
        response = requests.get(full_url, timeout=10)
        
        print(f'[通知] Bark返回: {response.text}')
    except Exception as error:
        print(f'[通知] Bark发送失败: {error}')


def send_pushplus(title, content, token=None, topic=None, template=None, channel=None):
    """
    PushPlus推送
    
    Args:
        title: 标题
        content: 内容
        token: 自定义token（可选）
        topic: 群组编码（发送到指定群组，可选）
        template: 发送模板 (html/txt/json/markdown，可选)
        channel: 发送渠道 (wechat/webhook/cp/mail/sms，可选)
    """
    pushplus_token = token or push_config['PUSH_PLUS_TOKEN']
    if not pushplus_token:
        raise ValueError('PushPlus token 未配置，请通过参数传入或设置 PUSH_PLUS_TOKEN')
    
    # 移除内部的 broad try/except 以便异常能够向上抛出，或者在最后把失败转为异常
    url = 'https://www.pushplus.plus/send'
    data = {
        'token': pushplus_token,
        'title': title,
        'content': content,
        'topic': topic or push_config['PUSH_PLUS_USER'],
        'template': template or push_config['PUSH_PLUS_TEMPLATE'],
        'channel': channel or push_config['PUSH_PLUS_CHANNEL']
    }
    
    response = requests.post(
        url,
        json=data,
        timeout=10
    )
    
    result = response.json()
    
    if result.get('code') == 200:
        print('[通知] PushPlus 推送成功')
        return True
    else:
        raise Exception(f"PushPlus API 返回错误: {result.get('msg', '未知错误')}")


def send_mail(title, content, host=None, port=None, user=None, password=None, to=None):
    """
    邮件SMTP推送
    
    Args:
        title: 标题
        content: 内容
        host: SMTP服务器地址（可选）
        port: SMTP端口（可选）
        user: 邮箱账号（可选）
        password: 邮箱密码（可选）
        to: 收件人邮箱（可选）
    """
    mail_config = {
        'host': host or push_config['MAIL_HOST'],
        'port': port or push_config['MAIL_PORT'],
        'user': user or push_config['MAIL_USER'],
        'pass': password or push_config['MAIL_PASS'],
        'to': to or push_config['MAIL_TO']
    }
    
    if not all([mail_config['host'], mail_config['port'], 
                mail_config['user'], mail_config['pass'], mail_config['to']]):
        return
    
    try:
        # 创建邮件对象
        message = MIMEMultipart()
        message['From'] = mail_config['user']
        message['To'] = mail_config['to']
        message['Subject'] = title
        
        # 添加HTML内容
        html_part = MIMEText(content, 'html', 'utf-8')
        message.attach(html_part)
        
        # 连接SMTP服务器并发送
        if mail_config['port'] == 465:
            # SSL连接
            server = smtplib.SMTP_SSL(mail_config['host'], mail_config['port'])
        else:
            # 普通连接
            server = smtplib.SMTP(mail_config['host'], mail_config['port'])
            server.starttls()
        
        server.login(mail_config['user'], mail_config['pass'])
        server.send_message(message)
        server.quit()
        
        print('[通知] 邮件发送成功')
    except Exception as error:
        print(f'[通知] 邮件发送失败: {error}')


def send(title, content, **options):
    """
    主发送函数 - 根据配置发送通知到所有渠道
    
    Args:
        title: 通知标题
        content: 通知内容
        **options: 可选参数（会传递给各个推送函数）
    """
    # 确保标题和内容是字符串
    title = str(title)
    # 为了兼容PushPlus和邮件，默认将换行符转为<br>
    content_html = str(content).replace('\n', '<br>')
    
    # 发送所有配置的通知渠道
    send_wechat(title, content_html, options.get('webhook'))
    send_serverchan(title, content_html, options.get('key'))
    send_bark(title, content_html, options.get('url'))
    try:
        send_pushplus(
            title, 
            content_html, 
            options.get('token'),
            options.get('topic'),
            options.get('template'),
            options.get('channel')
        )
    except Exception as e:
        print(f'[通知] PushPlus 发送失败: {e}')
        
    send_mail(
        title,
        content_html,
        options.get('host'),
        options.get('port'),
        options.get('user'),
        options.get('password'),
        options.get('to')
    )
    
    print('[通知] 所有推送任务已完成')


# 如果直接运行此脚本，执行测试
if __name__ == '__main__':
    import datetime
    
    test_title = f'通知测试 - {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
    test_content = f"""
这是一条测试消息

发送时间: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

测试内容：
✅ 支持中文字符
✅ 支持换行符
✅ 支持特殊符号 🎉

---
测试完成
    """.strip()
    
    print('========== 通知模块测试 ==========\n')
    print(f'测试标题: {test_title}')
    print(f'测试内容:\n{test_content}')
    print('\n正在发送通知...\n')
    
    send(test_title, test_content)
    
    print('\n✅ 测试完成！请检查你的通知渠道是否收到消息。')
