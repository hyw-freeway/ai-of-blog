/**
 * 认证相关工具函数
 * 管理 token 和用户登录状态
 */

const TOKEN_KEY = 'blog_token';
const USER_KEY = 'blog_user';

// 保存登录信息
export function setAuth(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
}

// 获取 token
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// 获取用户名
export function getUsername() {
  return localStorage.getItem(USER_KEY);
}

// 检查是否已登录
export function isLoggedIn() {
  return !!getToken();
}

// 清除登录信息（退出登录）
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
