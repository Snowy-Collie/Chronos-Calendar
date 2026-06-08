# Chronos Calendar (时空日历)

一个极具现代感、高美学价值的毛玻璃玻璃拟态（Glassmorphism）日历网页应用。支持自适应桌面与手机端排版，能够存储与管理事件、进行实时多单位倒计时，并生成精美的分享海报。

A highly-polished, premium glassmorphic calendar web application with dedicated desktop and mobile view layouts. It supports event storage, multi-unit countdown timers, and premium server-side sharing poster generation.

---

## 主要特色 / Features

1. **高拟真毛玻璃设计 (Premium Glassmorphic UI)**
   - 界面采用极富现代感的渐变色背景与半透明毛玻璃卡片（Glassmorphism）。
   - 自适应双面板布局：左侧交互式月历，右侧实时倒计时卡片流。
   - 手机端原生操作体验：底部滑出菜单面板（Bottom Sheet）和弹窗提示（Toast Alerts）。

2. **海报生成与保存 (Poster Generation & Inline Save)**
   - 全屏卡片放大效果：点击任意倒计时卡片可查看沉浸式全屏预览，支持对卡片的磨砂效果、透明度、背景色、字体颜色进行二次调色。
   - 服务端毛玻璃渲染 (Server-Side Glassmorphism)：采用 Python Pillow 库在后台进行高像素合成，动态裁剪背景并应用高斯模糊（GaussianBlur），使得下载的海报中卡片磨砂效果与网页预览完全一致。
   - 智能自动换行 (Auto Word-Wrapping)：自动处理中英文、日文混合长句换行，完美居中对齐，并随文本行数动态调整卡片高度。
   - 跨语种字体自动适配 (CJK Font Auto-Detection)：自动分析活动标题及倒计时语言。包含中日文字符时自动加载系统 CJK 字体（如微软雅黑/微软正黑/明瞭体），即使在英语 UI 下也能完美生成中日文海报。
   - 移动端友好保存机制 (WeChat/Mobile Friendly)：点击保存照片后，用户会被引导至独立的 inline 保存网页，在手机微信或浏览器上可通过“长按图片”直接保存至相册，电脑端可通过“右键另存为”保存。

3. **智能倒计时引擎 (Smart Countdown Parser)**
   - 倒计时模板自定义：支持如 `[title] 还有 [d] 天 [h] 小时` 标签定制。
   - 日期逻辑优化：当关闭时/分/秒单位时，自动按日历天数（子夜至子夜）计算倒计时，解决传统时间相减导致“明天发生但显示为0天后”的 Bug。

4. **轻量化后端服务 (Lightweight Flask Backend)**
   - 使用 Flask 提供 RESTful API 交互，事件数据持久化保存在本地 JSON 数据库中。
   - **局域网互联**: 默认绑定 `0.0.0.0`，允许同一局域网下的手机和平板轻松扫码或输入电脑 IP 进行访问。
   - **自动清理机制**: 自动在后台扫描并物理清除已经过去超过 16 天的过期活动（及其上传的背景图），防止占用服务器磁盘。

---

## 运行环境 / Requirements

- Python 3.7+
- 依赖库 / Python Packages:
  - `Flask`
  - `Pillow`

---

## 快速开始 / Quick Start

### 1. 安装依赖 / Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. 启动服务 / Run Server
```bash
python app.py
```
- 在本机浏览器打开: `http://localhost:5000`
- 在局域网其他设备（如手机）打开: `http://<YOUR_COMPUTER_IP>:5000`

### 3. 运行测试 / Run Tests
```bash
python test_app.py
```

---

## 技术栈 / Tech Stack

- **Backend**: Python (Flask), Pillow (Image processing)
- **Frontend**: HTML5, Vanilla CSS3, Javascript (ES6)
- **Localization**: Traditional Chinese (國語), English, Japanese (日本語)
