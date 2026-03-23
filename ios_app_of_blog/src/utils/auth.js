const TOKEN_KEY = 'blog_token'
const USERNAME_KEY = 'blog_username'

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}

export function getUsername() {
  return uni.getStorageSync(USERNAME_KEY) || ''
}

export function setUsername(username) {
  uni.setStorageSync(USERNAME_KEY, username)
}

export function isLoggedIn() {
  return !!getToken()
}

export function saveAuth(token, username) {
  setToken(token)
  setUsername(username)
}

export function clearAuth() {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(USERNAME_KEY)
}
