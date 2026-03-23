import { getToken, clearAuth } from '../utils/auth'

const BASE_URL = 'http://106.55.56.92'

function request(options) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const header = { 'Content-Type': 'application/json', ...options.header }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: 30000,
      success(res) {
        if (res.statusCode === 401) {
          clearAuth()
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期'))
          return
        }
        resolve(res.data)
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

// ========== 文章相关 ==========

export function getArticles(keyword = '', semantic = false) {
  const params = []
  if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`)
  if (semantic) params.push('semantic=true')
  const qs = params.length > 0 ? `?${params.join('&')}` : ''
  return request({ url: `/api/articles${qs}` })
}

export function getArticle(id) {
  return request({ url: `/api/articles/${id}` })
}

export function createArticle(data) {
  return request({ url: '/api/articles', method: 'POST', data })
}

export function updateArticle(id, data) {
  return request({ url: `/api/articles/${id}`, method: 'PUT', data })
}

export function deleteArticle(id) {
  return request({ url: `/api/articles/${id}`, method: 'DELETE' })
}

// ========== 认证相关 ==========

export function login(username, password) {
  return request({ url: '/api/auth/login', method: 'POST', data: { username, password } })
}

export function verifyToken() {
  return request({ url: '/api/auth/verify' })
}

// ========== 上传相关 ==========

export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    uni.uploadFile({
      url: `${BASE_URL}/api/upload/image`,
      filePath,
      name: 'image',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        resolve(data)
      },
      fail: reject
    })
  })
}

export function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    uni.uploadFile({
      url: `${BASE_URL}/api/upload/file`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        resolve(data)
      },
      fail: reject
    })
  })
}

export function getFileUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BASE_URL}${path}`
}

// ========== AI 相关 ==========

export function generateSummary(content) {
  return request({ url: '/api/ai/summary', method: 'POST', data: { content } })
}

export function getArticleFAQ(articleId, regenerate = false) {
  const qs = regenerate ? '?regenerate=true' : ''
  return request({ url: `/api/ai/faq/${articleId}${qs}` })
}

export function generateTags(title, content) {
  return request({ url: '/api/ai/tags', method: 'POST', data: { title, content } })
}

export function proofreadContent(content) {
  return request({ url: '/api/ai/proofread', method: 'POST', data: { content } })
}

export function generateEmbedding(title, content) {
  return request({ url: '/api/ai/embedding', method: 'POST', data: { title, content } })
}
