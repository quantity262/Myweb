# 本地服务器启动说明

由于浏览器的安全限制，直接打开 `index.html` 文件（使用 `file://` 协议）时，无法通过 `fetch` 加载 markdown 文件。因此需要使用本地 HTTP 服务器来运行网站。

## 快速启动方法

### 方法一：使用批处理文件（Windows）

1. 双击运行 `启动服务器.bat`
2. 等待服务器启动
3. 在浏览器中访问：`http://localhost:5500`

### 方法二：使用 Shell 脚本（Mac/Linux）

1. 在终端中运行：
   ```bash
   chmod +x 启动服务器.sh
   ./启动服务器.sh
   ```
2. 在浏览器中访问：`http://localhost:5500`

### 方法三：手动启动（推荐）

#### 使用 Python（最简单）

**Windows/Mac/Linux 通用：**

```bash
# Python 3.x
python -m http.server 5500

# 或者
python3 -m http.server 5500
```

然后在浏览器中访问：`http://localhost:5500`

#### 使用 Node.js

```bash
# 使用 npx（无需安装）
npx http-server . -p 5500 -c-1

# 或者全局安装后使用
npm install -g http-server
http-server . -p 5500 -c-1
```

#### 使用 PHP

```bash
php -S localhost:5500
```

## 端口说明

- 默认端口：`5500`
- 如果端口被占用，可以修改为其他端口（如 `8000`、`3000` 等）
- 修改端口后，记得在浏览器中访问对应的地址

## 停止服务器

在运行服务器的终端窗口中按 `Ctrl + C` 即可停止服务器。

## 常见问题

### 1. 端口被占用

如果提示端口被占用，可以：
- 关闭占用该端口的程序
- 或使用其他端口（修改命令中的端口号）

### 2. Python 未安装

- Windows: 访问 https://www.python.org/downloads/ 下载安装
- Mac: 通常已预装，或使用 `brew install python3`
- Linux: 使用包管理器安装，如 `sudo apt install python3`

### 3. Node.js 未安装

- 访问 https://nodejs.org/ 下载安装

## 推荐方案

**最简单的方式：使用 Python**

Python 通常已经预装在大多数系统上，只需在项目目录下运行：

```bash
python -m http.server 5500
```

然后在浏览器中打开 `http://localhost:5500` 即可。

