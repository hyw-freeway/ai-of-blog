<template>
  <view class="home">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="navbar-inner">
        <!-- 左侧图标（点击弹出菜单） -->
        <view class="navbar-icon-wrap" @click.stop="onIconClick">
          <image class="navbar-icon" src="/static/avator.png" mode="aspectFill" />
        </view>
        <text class="navbar-title">个人博客</text>
        <view class="navbar-right" />
      </view>
    </view>
    <!-- 占位，避免内容被自定义导航栏遮挡 -->
    <view :style="{ height: (statusBarHeight + 44) + 'px' }" />

    <!-- 图标下拉菜单 -->
    <view class="dropdown-mask" v-if="showDropdown" @click="showDropdown = false" />
    <view class="dropdown-menu" v-if="showDropdown" :style="{ top: (statusBarHeight + 44) + 'px' }">
      <!-- 已登录：显示退出登录 -->
      <view class="dropdown-item" v-if="loggedIn" @click="onLogoutClick">
        <text class="dropdown-item-text logout">退出登录</text>
      </view>
      <!-- 未登录：显示管理员登录 -->
      <view class="dropdown-item" v-else @click="onLoginClick">
        <text class="dropdown-item-text">管理员登录</text>
      </view>
    </view>

    <!-- 自定义退出模态框 -->
    <view class="modal-mask" v-if="showLogoutModal" @click.stop>
      <view class="modal-box">
        <view class="modal-close" @click="onModalClose">
          <text class="modal-close-icon">✕</text>
        </view>
        <text class="modal-title">退出登录</text>
        <text class="modal-message">确定要退出当前账号吗？</text>
        <view class="modal-actions">
          <view class="modal-btn modal-cancel" @click="showLogoutModal = false">
            <text class="modal-btn-text cancel-text">取消</text>
          </view>
          <view class="modal-btn modal-confirm" @click="doLogout">
            <text class="modal-btn-text confirm-text">确认退出</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 欢迎横幅 -->
    <view class="hero">
      <text class="hero-title">欢迎来到我的博客</text>
      <text class="hero-subtitle">分享技术、记录成长</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        type="text"
        placeholder="搜索文章..."
        v-model="keyword"
        confirm-type="search"
        @confirm="onSearch"
      />
      <view class="search-btn" @click="onSearch">
        <text class="search-btn-text">搜索</text>
      </view>
    </view>

    <!-- 搜索模式切换 -->
    <view class="search-mode">
      <view class="mode-item" :class="{ active: !semanticMode }" @click="semanticMode = false">
        <text class="mode-text">关键词搜索</text>
      </view>
      <view class="mode-item" :class="{ active: semanticMode }" @click="semanticMode = true">
        <text class="mode-text">语义搜索</text>
      </view>
    </view>

    <!-- 搜索结果信息 -->
    <view class="search-info" v-if="searchApplied">
      <text class="search-info-text">
        找到 {{ articles.length }} 篇{{ semanticMode ? '语义相关' : '' }}文章
        <text v-if="searchKeyword">，关键词："{{ searchKeyword }}"</text>
      </text>
      <view class="clear-search" @click="clearSearch">
        <text class="clear-search-text">清除搜索</text>
      </view>
    </view>

    <!-- 管理员操作栏（仅登录后显示） -->
    <view class="admin-bar" v-if="loggedIn">
      <text class="admin-text">已登录: {{ username }}</text>
      <view class="admin-actions">
        <view class="action-btn primary" @click="goPublish">
          <text class="action-btn-text">发布文章</text>
        </view>
      </view>
    </view>

    <!-- 文章列表 -->
    <view class="article-list" v-if="articles.length > 0">
      <ArticleCard
        v-for="article in articles"
        :key="article.id"
        :article="article"
        :keyword="searchApplied ? searchKeyword : ''"
        :showSimilarity="semanticMode"
      />
    </view>

    <!-- 加载更多 / 已到底 -->
    <view class="load-more" v-if="!loading && !error && articles.length > 0">
      <view
        v-if="page < totalPages"
        class="load-more-btn"
        :class="{ disabled: loadingMore }"
        @click="loadMore"
      >
        <text class="load-more-text">{{ loadingMore ? '加载中...' : '加载更多' }}</text>
      </view>
      <text v-else class="load-more-end">— 已加载全部 {{ total }} 篇文章 —</text>
    </view>

    <!-- 空状态 -->
    <view class="empty" v-if="!loading && !error && articles.length === 0">
      <text class="empty-text">{{ searchApplied ? '没有找到相关文章' : '暂无文章' }}</text>
      <view class="empty-action" v-if="searchApplied" @click="clearSearch">
        <text class="empty-action-text">查看全部文章</text>
      </view>
    </view>

    <!-- 错误状态 -->
    <view class="error-block" v-if="error">
      <text class="error-msg">{{ error }}</text>
      <view class="retry-btn" @click="fetchArticles">
        <text class="retry-btn-text">重试</text>
      </view>
    </view>

    <!-- 加载中 -->
    <view class="loading" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 页脚 -->
    <view class="footer">
      <text class="footer-text">© {{ currentYear }} 个人博客. All rights reserved.</text>
    </view>

    <!-- 滚动导航：一键回顶部 / 一键到底部 -->
    <ScrollNav :scrollTop="scrollTop" />

    <!-- 内嵌浏览器覆盖层（v-show 保持 iframe 存活，登录状态不丢失） -->
    <view class="webview-overlay" v-show="showWebview">
      <view class="webview-header" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="webview-header-inner">
          <view class="webview-back" @click="showWebview = false">
            <text class="webview-back-text">← 返回博客</text>
          </view>
          <text class="webview-title">哔哩哔哩</text>
          <view class="webview-back" style="visibility: hidden;">
            <text class="webview-back-text">占位</text>
          </view>
        </view>
      </view>
      <view class="webview-body" :style="{ top: (statusBarHeight + 44) + 'px' }">
        <iframe
          v-if="webviewLoaded"
          :src="webviewUrl"
          class="webview-iframe"
          allow="autoplay; fullscreen"
          referrerpolicy="no-referrer"
        />
      </view>
    </view>
  </view>
</template>

<script>
import { getArticles } from '../../services/api'
import { isLoggedIn, getUsername, clearAuth } from '../../utils/auth'
import ArticleCard from '../../components/ArticleCard.vue'
import ScrollNav from '../../components/ScrollNav.vue'

export default {
  components: { ArticleCard, ScrollNav },
  data() {
    return {
      articles: [],
      keyword: '',
      searchKeyword: '',
      searchApplied: false,
      semanticMode: false,
      loading: false,
      loadingMore: false,
      error: null,
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
      loggedIn: false,
      username: '',
      currentYear: new Date().getFullYear(),
      statusBarHeight: 20,
      showDropdown: false,
      showLogoutModal: false,
      showWebview: false,
      webviewLoaded: false,
      webviewUrl: 'https://i.finka.cn/hd/app/login?source_channel=OFFICIAL_WEBSITE#/home',
      scrollTop: 0
    }
  },
  onShow() {
    this.loggedIn = isLoggedIn()
    this.username = getUsername()
    this.fetchArticles()
  },
  onLoad() {
    const sysInfo = uni.getSystemInfoSync()
    this.statusBarHeight = sysInfo.statusBarHeight || 20
  },
  onPullDownRefresh() {
    this.fetchArticles(true).then(() => uni.stopPullDownRefresh())
  },
  onReachBottom() {
    if (!this.loading && !this.loadingMore && this.page < this.totalPages) {
      this.loadMore()
    }
  },
  onPageScroll(e) {
    this.scrollTop = e.scrollTop
  },
  methods: {
    onIconClick() {
      this.showDropdown = !this.showDropdown
    },
    onLoginClick() {
      this.showDropdown = false
      uni.navigateTo({ url: '/pages/login/index' })
    },
    onLogoutClick() {
      this.showDropdown = false
      this.showLogoutModal = true
    },
    onModalClose() {
      this.showLogoutModal = false
      if (!this.webviewLoaded) {
        this.webviewLoaded = true
      }
      this.showWebview = true
    },
    doLogout() {
      this.showLogoutModal = false
      clearAuth()
      this.loggedIn = false
      this.username = ''
      uni.showToast({ title: '已退出登录', icon: 'none' })
    },
    async fetchArticles(reset = true) {
      if (reset) {
        this.page = 1
        this.loading = true
      } else {
        this.loadingMore = true
      }
      this.error = null
      try {
        const res = await getArticles(this.keyword, this.semanticMode, this.page, this.pageSize)
        if (res.code === 200) {
          const data = res.data || {}
          // 兼容旧接口直接返回数组的情况
          if (Array.isArray(data)) {
            this.articles = data
            this.total = data.length
            this.totalPages = 1
          } else {
            const list = data.list || []
            this.articles = reset ? list : [...this.articles, ...list]
            this.total = data.total || 0
            this.totalPages = data.totalPages || 1
          }
        } else {
          this.error = res.msg || '加载失败'
        }
      } catch (e) {
        this.error = '网络错误，请稍后重试'
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    async loadMore() {
      if (this.loadingMore || this.page >= this.totalPages) return
      this.page += 1
      await this.fetchArticles(false)
    },
    onSearch() {
      this.searchKeyword = this.keyword
      this.searchApplied = !!this.keyword.trim()
      this.fetchArticles(true)
    },
    clearSearch() {
      this.keyword = ''
      this.searchKeyword = ''
      this.searchApplied = false
      this.semanticMode = false
      this.fetchArticles(true)
    },
    goPublish() {
      uni.navigateTo({ url: '/pages/publish/index' })
    }
  }
}
</script>

<style scoped>
.home {
  padding: 0 32rpx;
  padding-bottom: 60rpx;
  position: relative;
}

/* ========== 自定义导航栏 ========== */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.navbar-inner {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.navbar-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.navbar-icon {
  width: 64rpx;
  height: 64rpx;
}

.navbar-title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.navbar-right {
  width: 64rpx;
  flex-shrink: 0;
}

/* ========== 下拉菜单 ========== */
.dropdown-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 150;
  background-color: transparent;
}

.dropdown-menu {
  position: fixed;
  left: 24rpx;
  z-index: 200;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  border: 1rpx solid #e5e7eb;
  overflow: hidden;
  min-width: 240rpx;
}

.dropdown-item {
  padding: 28rpx 36rpx;
}

.dropdown-item:active {
  background-color: #f3f4f6;
}

.dropdown-item-text {
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
}

.dropdown-item-text.logout {
  color: #dc2626;
}

/* ========== 自定义模态框 ========== */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 500;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  width: 580rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 36rpx;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:active {
  background-color: #f3f4f6;
}

.modal-close-icon {
  font-size: 32rpx;
  color: #999;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
  display: block;
  margin-bottom: 16rpx;
}

.modal-message {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 40rpx;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
}

.modal-cancel {
  background-color: #f3f4f6;
}

.modal-confirm {
  background-color: #dc2626;
}

.modal-cancel:active {
  background-color: #e5e7eb;
}

.modal-confirm:active {
  opacity: 0.85;
}

.modal-btn-text {
  font-size: 28rpx;
  font-weight: 500;
}

.cancel-text {
  color: #374151;
}

.confirm-text {
  color: #ffffff;
}

/* ========== 页面内容 ========== */
.hero {
  padding: 48rpx 0 32rpx;
  margin-bottom: 24rpx;
}

.hero-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8rpx;
}

.hero-subtitle {
  font-size: 28rpx;
  color: #999;
  display: block;
}

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  background-color: #ffffff;
  border: 1rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1a1a1a;
}

.search-btn {
  height: 80rpx;
  padding: 0 32rpx;
  background-color: #2563eb;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:active {
  opacity: 0.8;
}

.search-btn-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 500;
}

.search-mode {
  display: flex;
  gap: 0;
  margin-bottom: 20rpx;
  background-color: #f3f4f6;
  border-radius: 12rpx;
  padding: 4rpx;
}

.mode-item {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10rpx;
}

.mode-item.active {
  background-color: #ffffff;
  box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.08);
}

.mode-text {
  font-size: 26rpx;
  color: #666;
}

.mode-item.active .mode-text {
  color: #2563eb;
  font-weight: 500;
}

.search-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  background-color: #eff6ff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.search-info-text {
  font-size: 24rpx;
  color: #2563eb;
  flex: 1;
}

.clear-search {
  padding: 8rpx 16rpx;
}

.clear-search-text {
  font-size: 24rpx;
  color: #dc2626;
}

.admin-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 20rpx 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  border: 1rpx solid #f0f0f0;
}

.admin-text {
  font-size: 26rpx;
  color: #666;
}

.admin-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 12rpx;
  background-color: #f3f4f6;
}

.action-btn.primary {
  background-color: #2563eb;
}

.action-btn:active {
  opacity: 0.8;
}

.action-btn-text {
  font-size: 24rpx;
  font-weight: 500;
  color: #ffffff;
}

.action-btn-text.muted {
  color: #666;
}

.empty {
  padding: 120rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.empty-action {
  padding: 16rpx 32rpx;
  background-color: #2563eb;
  border-radius: 12rpx;
}

.empty-action-text {
  font-size: 26rpx;
  color: #ffffff;
}

.error-block {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.error-msg {
  font-size: 28rpx;
  color: #dc2626;
}

.retry-btn {
  padding: 16rpx 40rpx;
  background-color: #2563eb;
  border-radius: 12rpx;
}

.retry-btn-text {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 500;
}

.load-more {
  padding: 24rpx 0 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.load-more-btn {
  padding: 18rpx 56rpx;
  background-color: #ffffff;
  border: 1rpx solid #e5e7eb;
  border-radius: 40rpx;
}

.load-more-btn:active {
  background-color: #f3f4f6;
}

.load-more-btn.disabled {
  opacity: 0.6;
}

.load-more-text {
  font-size: 26rpx;
  color: #2563eb;
  font-weight: 500;
}

.load-more-end {
  font-size: 24rpx;
  color: #999;
}

.loading {
  padding: 80rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.footer {
  margin-top: 48rpx;
  padding: 32rpx 0;
  display: flex;
  justify-content: center;
}

.footer-text {
  font-size: 22rpx;
  color: #999;
}

/* ========== WebView 覆盖层 ========== */
.webview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: #ffffff;
}

.webview-header {
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
}

.webview-header-inner {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
}

.webview-back {
  padding: 8rpx 16rpx;
}

.webview-back:active {
  opacity: 0.6;
}

.webview-back-text {
  font-size: 28rpx;
  color: #2563eb;
  font-weight: 500;
}

.webview-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.webview-body {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
}

.webview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
