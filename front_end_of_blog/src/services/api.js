/**
 * API 请求封装
 * 使用 Axios 统一管理 HTTP 请求
 */
import axios from 'axios';
import { getToken, clearAuth } from '../utils/auth';

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ========== 文章相关 API ==========

// 获取文章列表（支持搜索）
export const getArticles = (keyword = '') => {
  const params = keyword ? { keyword } : {};
  return api.get('/api/articles', { params });
};

// 获取文章详情
export const getArticle = (id) => api.get(`/api/articles/${id}`);

// 创建文章
export const createArticle = (data) => api.post('/api/articles', data);

// 更新文章
export const updateArticle = (id, data) => api.put(`/api/articles/${id}`, data);

// 删除文章
export const deleteArticle = (id) => api.delete(`/api/articles/${id}`);

// ========== 上传相关 API ==========

// 上传图片
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/api/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 上传文件
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 获取完整的文件 URL
export const getFileUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  return `${baseUrl}${path}`;
};

// ========== 认证相关 API ==========

// 管理员登录
export const login = (username, password) => 
  api.post('/api/auth/login', { username, password });

// 验证 token
export const verifyToken = () => api.get('/api/auth/verify');

export default api;
