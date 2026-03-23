<template>
  <view class="login-page">
    <view class="login-card">
      <text class="login-title">管理员登录</text>
      <text class="login-subtitle">登录后可发布、编辑和删除文章</text>

      <view class="form-group">
        <text class="form-label">用户名</text>
        <input
          class="form-input"
          type="text"
          placeholder="请输入用户名"
          v-model="username"
        />
      </view>

      <view class="form-group">
        <text class="form-label">密码</text>
        <input
          class="form-input"
          type="password"
          placeholder="请输入密码"
          v-model="password"
          @confirm="doLogin"
        />
      </view>

      <view class="login-btn" :class="{ disabled: submitting }" @click="doLogin">
        <text class="login-btn-text">{{ submitting ? '登录中...' : '登录' }}</text>
      </view>

      <view class="login-error" v-if="errorMsg">
        <text class="error-text">{{ errorMsg }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { login } from '../../services/api'
import { saveAuth, isLoggedIn } from '../../utils/auth'

export default {
  data() {
    return {
      username: '',
      password: '',
      submitting: false,
      errorMsg: ''
    }
  },
  onShow() {
    if (isLoggedIn()) {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
    }
  },
  methods: {
    async doLogin() {
      if (this.submitting) return
      if (!this.username.trim() || !this.password.trim()) {
        this.errorMsg = '请输入用户名和密码'
        return
      }
      this.submitting = true
      this.errorMsg = ''
      try {
        const res = await login(this.username, this.password)
        if (res.code === 200 && res.data?.token) {
          saveAuth(res.data.token, res.data.username || this.username)
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
          }, 1500)
        } else {
          this.errorMsg = res.msg || '登录失败'
        }
      } catch (e) {
        this.errorMsg = '网络错误，请稍后重试'
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  padding: 80rpx 32rpx;
  min-height: 100vh;
  background-color: #fafafa;
}

.login-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid #f0f0f0;
}

.login-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12rpx;
  display: block;
}

.login-subtitle {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 48rpx;
  display: block;
}

.form-group {
  margin-bottom: 32rpx;
}

.form-label {
  font-size: 26rpx;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background-color: #fafafa;
  border: 1rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1a1a1a;
  box-sizing: border-box;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  background-color: #2563eb;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16rpx;
}

.login-btn:active {
  opacity: 0.85;
}

.login-btn.disabled {
  opacity: 0.6;
}

.login-btn-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
}

.login-error {
  margin-top: 24rpx;
  padding: 16rpx 24rpx;
  background-color: #fef2f2;
  border-radius: 12rpx;
}

.error-text {
  font-size: 26rpx;
  color: #dc2626;
}
</style>
