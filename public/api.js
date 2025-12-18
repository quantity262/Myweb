// API配置
const API_BASE_URL = window.location.origin;

// 获取token
function getToken() {
    return localStorage.getItem('token');
}

// 设置token
function setToken(token) {
    localStorage.setItem('token', token);
}

// 移除token
function removeToken() {
    localStorage.removeItem('token');
}

// 获取用户信息
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// 设置用户信息
function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// 移除用户信息
function removeUser() {
    localStorage.removeItem('user');
}

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
            ...options,
            headers
        });

        // 如果响应不是JSON，先尝试解析
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text || '服务器返回了非JSON格式的响应');
        }

        if (!response.ok) {
            throw new Error(data.error || `请求失败 (${response.status})`);
        }

        return data;
    } catch (error) {
        // 如果是网络错误，提供更友好的提示
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('网络连接失败，请检查服务器是否运行');
        }
        throw error;
    }
}

// 认证API
const authAPI = {
    register: async (username, email, password) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    },

    login: async (username, password) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    getMe: async () => {
        return apiRequest('/auth/me');
    },

    changePassword: async (currentPassword, newPassword) => {
        return apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    logout: () => {
        removeToken();
        removeUser();
        window.location.href = '/login.html';
    }
};

// 内容API
const contentAPI = {
    getDocuments: async () => {
        return apiRequest('/content/documents');
    },

    getDocument: async (filename) => {
        return apiRequest(`/content/documents/${filename}`);
    }
};

// 留言API
const messageAPI = {
    getMessages: async () => {
        return apiRequest('/messages');
    },

    createMessage: async (content) => {
        return apiRequest('/messages', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },

    deleteMessage: async (messageId) => {
        return apiRequest(`/messages/${messageId}`, {
            method: 'DELETE'
        });
    }
};

// 管理员API
const adminAPI = {
    getUsers: async () => {
        return apiRequest('/admin/users');
    },

    deleteUser: async (userId) => {
        return apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    },

    updateUserRole: async (userId, role) => {
        return apiRequest(`/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role })
        });
    },

    getDocuments: async () => {
        return apiRequest('/admin/documents');
    },

    createDocument: async (title, filename, content) => {
        return apiRequest('/admin/documents', {
            method: 'POST',
            body: JSON.stringify({ title, filename, content })
        });
    },

    deleteDocument: async (docId) => {
        return apiRequest(`/admin/documents/${docId}`, {
            method: 'DELETE'
        });
    },

    syncDocuments: async () => {
        return apiRequest('/admin/documents/sync', {
            method: 'POST'
        });
    },

    getMessages: async () => {
        return apiRequest('/admin/messages');
    },

    resetPassword: async (userId, newPassword) => {
        return apiRequest(`/admin/users/${userId}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword })
        });
    }
};

// 检查认证状态
function checkAuth() {
    const token = getToken();
    const user = getUser();
    return token && user;
}

// 检查是否为管理员
function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}

// 需要认证的路由保护
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// 需要管理员权限的路由保护
function requireAdmin() {
    if (!requireAuth()) {
        return false;
    }
    if (!isAdmin()) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

