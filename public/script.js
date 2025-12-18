// 照片数据
const galleryData = [
    {
        image: 'Myphoto/IMG_20250308_154345.jpg',
        thumbnail: 'Myphoto/IMG_20250308_154345.jpg',
        description: '照片1'
    },
    {
        image: 'Myphoto/IMG_20250320_190502.jpg',
        thumbnail: 'Myphoto/IMG_20250320_190502.jpg',
        description: '照片2'
    },
    {
        image: 'Myphoto/IMG_20250525_135121.jpg',
        thumbnail: 'Myphoto/IMG_20250525_135121.jpg',
        description: '照片3'
    },
    {
        image: 'Myphoto/IMG_20250921_152157.jpg',
        thumbnail: 'Myphoto/IMG_20250921_152157.jpg',
        description: '照片4'
    },
    {
        image: 'Myphoto/IMG_20250921_161014.jpg',
        thumbnail: 'Myphoto/IMG_20250921_161014.jpg',
        description: '照片5'
    },
    {
        image: 'Myphoto/IMG_20251026_151306.jpg',
        thumbnail: 'Myphoto/IMG_20251026_151306.jpg',
        description: '照片6'
    }
];

// 照片轮播功能
class GalleryCarousel {
    constructor() {
        this.currentIndex = 0;
        this.init();
    }

    init() {
        this.mainImage = document.getElementById('mainImage');
        this.imageDescription = document.getElementById('imageDescription');
        this.imageTime = document.getElementById('imageTime');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.indicators = document.getElementById('indicators');
        this.thumbnailItems = document.querySelectorAll('.thumbnail-item');
        this.galleryContainer = document.querySelector('.gallery-container');

        // 创建指示器
        this.createIndicators();
        
        // 绑定事件
        this.bindEvents();
        
        // 更新显示
        this.updateDisplay();
    }

    createIndicators() {
        galleryData.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'indicator';
            if (index === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => this.goToSlide(index));
            this.indicators.appendChild(indicator);
        });
    }

    bindEvents() {
        // 按钮事件
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());

        // 缩略图事件
        this.thumbnailItems.forEach((item, index) => {
            item.addEventListener('click', () => this.goToSlide(index));
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });

        // 触摸事件（移动设备）
        let touchStartX = 0;
        let touchEndX = 0;

        this.galleryContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        this.galleryContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) {
                this.nextSlide();
            }
            if (touchEndX > touchStartX + 50) {
                this.prevSlide();
            }
        });
    }

    goToSlide(index) {
        this.currentIndex = index;
        this.updateDisplay();
    }

    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % galleryData.length;
        this.updateDisplay();
    }

    prevSlide() {
        this.currentIndex = (this.currentIndex - 1 + galleryData.length) % galleryData.length;
        this.updateDisplay();
    }

    extractTimeFromFilename(filename) {
        // 从文件名 IMG_YYYYMMDD_HHMMSS.jpg 提取时间
        const match = filename.match(/IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.jpg/);
        if (match) {
            const [, year, month, day, hour, minute] = match;
            return `${year}年${parseInt(month)}月${parseInt(day)}日 ${hour}:${minute}`;
        }
        return '';
    }

    updateDisplay() {
        const currentData = galleryData[this.currentIndex];
        
        // 提取并格式化时间
        const timeStr = this.extractTimeFromFilename(currentData.image);
        
        // 淡入淡出效果
        this.mainImage.style.opacity = '0';
        setTimeout(() => {
            this.mainImage.src = currentData.image;
            this.mainImage.alt = currentData.description;
            this.imageDescription.textContent = currentData.description;
            this.imageTime.textContent = timeStr;
            this.mainImage.style.opacity = '1';
        }, 250);

        // 更新缩略图
        this.thumbnailItems.forEach((item, index) => {
            if (index === this.currentIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 更新指示器
        const indicatorElements = this.indicators.querySelectorAll('.indicator');
        indicatorElements.forEach((indicator, index) => {
            if (index === this.currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

}


// 导航功能
class Navigation {
    constructor() {
        this.init();
    }

    init() {
        this.hamburger = document.getElementById('hamburger');
        this.navMenu = document.getElementById('navMenu');
        this.navLinks = document.querySelectorAll('.nav-link');

        // 汉堡菜单
        if (this.hamburger) {
            this.hamburger.addEventListener('click', () => {
                this.navMenu.classList.toggle('active');
                this.hamburger.classList.toggle('active');
            });
        }

        // 导航链接点击
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                
                // 如果是锚点链接（#开头），阻止默认行为并滚动
                if (targetId && targetId.startsWith('#')) {
                    e.preventDefault();
                    this.scrollToSection(targetId);
                    
                    // 更新活动状态
                    this.navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    // 关闭移动菜单
                    if (this.navMenu.classList.contains('active')) {
                        this.navMenu.classList.remove('active');
                    }
                }
                // 如果是外部链接（如 /profile.html, /admin.html），允许默认行为（跳转）
            });
        });

        // 滚动时更新活动状态
        window.addEventListener('scroll', () => this.updateActiveNav());
    }

    scrollToSection(targetId) {
        const section = document.querySelector(targetId);
        if (section) {
            const offsetTop = section.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos <= bottom) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// 页面滚动动画
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.gallery-section, .log-section, .social-section');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

// 微信弹窗功能
function initWechatModal() {
    const wechatLink = document.getElementById('wechatLink');
    const wechatModal = document.getElementById('wechatModal');
    const closeModal = document.getElementById('closeModal');

    if (wechatLink && wechatModal) {
        // 打开弹窗
        wechatLink.addEventListener('click', (e) => {
            e.preventDefault();
            wechatModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });

        // 关闭弹窗
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                wechatModal.classList.remove('active');
                document.body.style.overflow = ''; // 恢复滚动
            });
        }

        // 点击背景关闭弹窗
        wechatModal.addEventListener('click', (e) => {
            if (e.target === wechatModal) {
                wechatModal.classList.remove('active');
                document.body.style.overflow = ''; // 恢复滚动
            }
        });

        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && wechatModal.classList.contains('active')) {
                wechatModal.classList.remove('active');
                document.body.style.overflow = ''; // 恢复滚动
            }
        });
    }
}

// 文档查看功能
class LogViewer {
    constructor() {
        this.logs = [];

        // 配置marked.js选项
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true, // 支持换行
                gfm: true, // GitHub风格markdown
                headerIds: false,
                mangle: false
            });
        }

        this.logListEl = document.getElementById('logList');
        this.logTitleEl = document.getElementById('logTitle');
        this.logViewerEl = document.getElementById('logViewer');

        if (!this.logListEl || !this.logTitleEl || !this.logViewerEl) {
            return;
        }

        this.currentId = null;
        
        // 从API加载文档列表
        this.loadDocuments();
    }

    async loadDocuments() {
        try {
            const response = await contentAPI.getDocuments();
            if (response && response.documents) {
                this.logs = response.documents.map((doc, index) => ({
                    id: doc.id || `file_${doc.filename}`,
                    title: doc.title || doc.filename.replace('.md', ''),
                    filename: doc.filename
                }));
            } else {
                this.logs = [];
            }
            this.init();
        } catch (error) {
            console.error('加载文档列表失败:', error);
            this.logs = [];
            this.init();
            if (this.logViewerEl) {
                this.logViewerEl.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 20px;">加载文档失败: ${error.message || '请检查网络连接'}</p>`;
            }
        }
    }

    init() {
        this.renderList();
        if (this.logs.length > 0) {
            this.loadLog(this.logs[0].id);
        } else {
            this.logViewerEl.innerHTML = '<p style="color: #999; text-align: center;">暂无文档</p>';
        }
    }

    renderList() {
        this.logListEl.innerHTML = '';
        this.logs.forEach(log => {
            const li = document.createElement('li');
            li.className = 'log-item';
            li.dataset.id = log.id;

            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.alignItems = 'center';
            left.className = 'log-item-left';

            const icon = document.createElement('span');
            icon.className = 'log-item-icon';
            icon.textContent = '📄';

            const name = document.createElement('span');
            name.className = 'log-item-name';
            name.textContent = log.title;

            left.appendChild(icon);
            left.appendChild(name);
            li.appendChild(left);

            li.addEventListener('click', () => this.loadLog(log.id));
            this.logListEl.appendChild(li);
        });
    }

    async loadLog(id) {
        const log = this.logs.find(l => l.id === id);
        if (!log) return;

        this.currentId = id;

        // 更新列表高亮
        Array.from(this.logListEl.children).forEach(li => {
            li.classList.toggle('active', li.dataset.id === id);
        });

        this.logTitleEl.textContent = log.title;
        this.logViewerEl.innerHTML = '<p style="color: #999; text-align: center;">加载中...</p>';

        try {
            const response = await contentAPI.getDocument(log.filename);
            
            if (response && response.content) {
                // 如果是markdown文件，使用marked.js渲染
                if (log.filename.endsWith('.md') && typeof marked !== 'undefined') {
                    this.renderMarkdown(response.content);
                } else {
                    // 普通文本文件，直接显示
                    this.renderContent(response.content);
                }
            } else {
                this.logViewerEl.innerHTML = '<p style="color: #999; text-align: center;">文档内容为空</p>';
            }
        } catch (error) {
            console.error('加载文档失败:', error);
            const errorMsg = error.message || '请稍后重试';
            this.logViewerEl.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p style="color: #ef4444; margin-bottom: 10px; font-weight: 500;">加载文档失败</p>
                    <p style="color: #999; font-size: 13px;">${errorMsg}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 10px;">文件: ${log.filename}</p>
                </div>
            `;
        }
    }

    renderMarkdown(markdownText) {
        try {
            const html = marked.parse(markdownText);
            this.logViewerEl.innerHTML = html;
        } catch (e) {
            console.error('Markdown渲染失败:', e);
            this.logViewerEl.innerHTML = '<p style="color: #ef4444;">Markdown渲染失败</p>';
        }
    }

    renderContent(text) {
        // 将文本转换为HTML，保留换行
        const html = text.split('\n').map(line => {
            if (line.trim() === '') {
                return '<br>';
            }
            return `<p>${this.escapeHtml(line)}</p>`;
        }).join('');
        this.logViewerEl.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态，未登录则重定向到登录页
    if (typeof checkAuth !== 'undefined' && !checkAuth()) {
        window.location.href = '/login.html';
        return;
    }

    // 检查登录状态并更新导航
    if (typeof checkAuth !== 'undefined') {
        updateAuthNav();
    }

    new GalleryCarousel();
    new Navigation();
    initScrollAnimations();
    initWechatModal();
    new LogViewer();
    new MessageBoard(); // 初始化留言板
});

// 更新认证导航
function updateAuthNav() {
    const authNavItem = document.getElementById('authNavItem');
    const authLink = document.getElementById('authLink');
    
    if (!authNavItem || !authLink) return;
    
    if (checkAuth()) {
        const user = getUser();
        authLink.textContent = user.role === 'admin' ? '管理后台' : '个人中心';
        authLink.href = user.role === 'admin' ? '/admin.html' : '/profile.html';
        
        // 确保链接可以点击，移除可能阻止默认行为的处理
        authLink.removeAttribute('onclick');
        authLink.onclick = null;
        
        // 添加登出按钮
        if (!document.getElementById('logoutBtn')) {
            const logoutBtn = document.createElement('a');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.href = '#';
            logoutBtn.className = 'nav-link';
            logoutBtn.textContent = '登出';
            logoutBtn.style.marginLeft = '10px';
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                authAPI.logout();
            });
            authNavItem.appendChild(logoutBtn);
        }
    } else {
        authLink.textContent = '登录';
        authLink.href = '/login.html';
        authLink.removeAttribute('onclick');
        authLink.onclick = null;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.remove();
        }
    }
}

// 留言板功能
class MessageBoard {
    constructor() {
        this.messagesListEl = document.getElementById('messagesList');
        this.messageForm = document.getElementById('messageForm');
        this.messageContent = document.getElementById('messageContent');
        this.charCountEl = document.getElementById('charCount');

        if (!this.messagesListEl) {
            console.warn('留言列表元素未找到，跳过留言板初始化');
            return;
        }
        
        // 即使没有表单，也可以加载留言列表
        if (!this.messageForm) {
            console.warn('留言表单元素未找到');
        }

        this.init();
    }

    init() {
        this.loadMessages();
        this.setupForm();
    }

    setupForm() {
        // 字符计数
        if (this.messageContent && this.charCountEl) {
            this.messageContent.addEventListener('input', () => {
                const count = this.messageContent.value.length;
                this.charCountEl.textContent = count;
                if (count > 1000) {
                    this.charCountEl.style.color = '#ef4444';
                } else {
                    this.charCountEl.style.color = '#666';
                }
            });
        }

        // 提交表单
        this.messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitMessage();
        });
    }

    async loadMessages() {
        if (!this.messagesListEl) return;
        
        try {
            const response = await messageAPI.getMessages();
            if (response && response.messages) {
                this.renderMessages(response.messages);
            } else {
                this.renderMessages([]);
            }
        } catch (error) {
            console.error('加载留言失败:', error);
            const errorMsg = error.message || '加载留言失败，请刷新重试';
            if (error.message && error.message.includes('未提供访问令牌') || error.message.includes('无效的访问令牌')) {
                this.messagesListEl.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 20px;">请先登录才能查看留言</p>';
            } else {
                this.messagesListEl.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 20px;">${errorMsg}</p>`;
            }
        }
    }

    renderMessages(messages) {
        if (!messages || messages.length === 0) {
            this.messagesListEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无留言，快来发表第一条吧！</p>';
            return;
        }

        this.messagesListEl.innerHTML = messages.map(msg => `
            <div class="message-item">
                <div class="message-header">
                    <span class="message-username">${this.escapeHtml(msg.username)}</span>
                    <span class="message-time">${this.formatTime(msg.created_at)}</span>
                </div>
                <div class="message-content">${this.escapeHtml(msg.content).replace(/\n/g, '<br>')}</div>
            </div>
        `).join('');
    }

    async submitMessage() {
        if (!this.messageForm || !this.messageContent) {
            alert('留言表单未初始化');
            return;
        }

        const content = this.messageContent.value.trim();
        
        if (!content) {
            alert('请输入留言内容');
            return;
        }

        if (content.length > 1000) {
            alert('留言内容不能超过1000个字符');
            return;
        }

        const submitBtn = this.messageForm.querySelector('.message-submit-btn');
        if (!submitBtn) {
            alert('提交按钮未找到');
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '发表中...';

        try {
            await messageAPI.createMessage(content);
            this.messageContent.value = '';
            if (this.charCountEl) {
                this.charCountEl.textContent = '0';
                this.charCountEl.style.color = '#666';
            }
            await this.loadMessages();
        } catch (error) {
            alert(error.message || '发表留言失败，请重试');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    formatTime(timeString) {
        const date = new Date(timeString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
