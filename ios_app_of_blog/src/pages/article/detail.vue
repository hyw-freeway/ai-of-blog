<template>
  <view class="detail">
    <!-- 加载中 -->
    <view class="center-block" v-if="loading">
      <text class="muted-text">加载中...</text>
    </view>

    <!-- 错误 -->
    <view class="center-block" v-else-if="error">
      <text class="error-text">{{ error }}</text>
      <view class="nav-btn" @click="goHome">
        <text class="nav-btn-text">返回首页</text>
      </view>
    </view>

    <!-- 文章内容 -->
    <view class="article" v-else-if="article">
      <!-- 标题 -->
      <text class="article-title">{{ article.title }}</text>

      <!-- 元信息 -->
      <view class="article-meta">
        <text class="meta-date">{{ formatDate(article.createTime) }}</text>
        <text class="meta-author" v-if="article.author">· {{ article.author }}</text>
      </view>

      <!-- 标签 -->
      <view class="article-tags" v-if="article.tags">
        <text class="tag" v-for="(tag, i) in tagList" :key="i">{{ tag }}</text>
      </view>

      <!-- AI 摘要 -->
      <AiSummary
        :summary="article.ai_summary || generatedSummary"
        :loading="summaryLoading"
        :showRegenerate="!!(article.ai_summary || generatedSummary)"
        :showGenerate="!article.ai_summary && !generatedSummary && !summaryLoading && article.content && article.content.length >= 50"
        @generate="doGenerateSummary"
        @regenerate="doGenerateSummary"
      />

      <!-- Markdown 内容 -->
      <rich-text class="article-content" :nodes="htmlContent" />

      <!-- 附件列表 -->
      <view class="attachments" v-if="files.length > 0">
        <text class="attachments-title">附件</text>
        <view class="file-list">
          <view
            class="file-item"
            v-for="(file, i) in files"
            :key="i"
            @click="handleFileClick(file)"
          >
            <text class="file-icon">📄</text>
            <text class="file-name">{{ file.name }}</text>
            <text class="file-action-hint">点击下载</text>
          </view>
        </view>
      </view>

      <!-- FAQ -->
      <FaqAccordion :items="faqItems" :loading="faqLoading" />

      <!-- 管理员操作 -->
      <view class="admin-actions" v-if="canEdit">
        <view class="btn btn-secondary" @click="goEdit">
          <text class="btn-text">编辑文章</text>
        </view>
        <view class="btn btn-danger" @click="confirmDelete">
          <text class="btn-text-danger">{{ deleting ? '删除中...' : '删除文章' }}</text>
        </view>
      </view>

      <!-- 返回链接 -->
      <view class="back-link" @click="goHome">
        <text class="back-link-text">← 返回文章列表</text>
      </view>

      <!-- 页脚 -->
      <view class="footer">
        <text class="footer-text">© {{ currentYear }} 个人博客. All rights reserved.</text>
      </view>
    </view>

    <!-- 滚动导航：一键回顶部 / 一键到底部 -->
    <ScrollNav :scrollTop="scrollTop" />
  </view>
</template>

<script>
import { marked } from 'marked'
import { getArticle, deleteArticle, getArticleFAQ, generateSummary, getFileUrl } from '../../services/api'
import { isLoggedIn, getUsername } from '../../utils/auth'
import AiSummary from '../../components/AiSummary.vue'
import FaqAccordion from '../../components/FaqAccordion.vue'
import ScrollNav from '../../components/ScrollNav.vue'

marked.setOptions({ gfm: true, breaks: true })

const FILE_EXT_REGEX = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md|zip|rar|7z)$/i

function extractFiles(content) {
  if (!content) return []
  const imageRegex = /!\[.*?\]\((.*?)\)/g
  const linkRegex = /\[(.*?)\]\((.*?)\)/g
  const files = []
  const imageUrls = new Set()
  let match
  while ((match = imageRegex.exec(content)) !== null) {
    imageUrls.add(match[1])
  }
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2]
    const name = match[1].replace(/^[📄📎]\s?/, '').trim()
    if (!imageUrls.has(url) && FILE_EXT_REGEX.test(url)) {
      files.push({ name, url, isPdf: url.toLowerCase().endsWith('.pdf') })
    }
  }
  return files
}

export default {
  components: { AiSummary, FaqAccordion, ScrollNav },
  data() {
    return {
      article: null,
      loading: true,
      error: null,
      faqItems: [],
      faqLoading: false,
      articleId: null,
      deleting: false,
      summaryLoading: false,
      generatedSummary: '',
      currentYear: new Date().getFullYear(),
      scrollTop: 0
    }
  },
  computed: {
    htmlContent() {
      if (!this.article?.content) return ''
      return marked(this.article.content)
    },
    tagList() {
      if (!this.article?.tags) return []
      return this.article.tags.split(',').map(t => t.trim()).filter(Boolean)
    },
    canEdit() {
      return isLoggedIn() && this.article && this.article.author === getUsername()
    },
    files() {
      return extractFiles(this.article?.content)
    }
  },
  onLoad(options) {
    this.articleId = options.id
    this.fetchArticle()
  },
  onPageScroll(e) {
    this.scrollTop = e.scrollTop
  },
  methods: {
    async fetchArticle() {
      this.loading = true
      this.error = null
      try {
        const res = await getArticle(this.articleId)
        if (res.code === 200) {
          this.article = res.data
          uni.setNavigationBarTitle({ title: res.data.title || '文章详情' })
          this.fetchFAQ()
          if (!res.data.ai_summary && res.data.content && res.data.content.length >= 50) {
            this.doGenerateSummary()
          }
        } else {
          this.error = res.msg || '文章不存在'
        }
      } catch (e) {
        this.error = '网络错误，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    async fetchFAQ() {
      this.faqLoading = true
      try {
        const res = await getArticleFAQ(this.articleId)
        if (res.code === 200 && res.data?.faq) {
          this.faqItems = res.data.faq
        }
      } catch (e) {
        console.error('获取FAQ失败', e)
      } finally {
        this.faqLoading = false
      }
    },
    async doGenerateSummary() {
      if (!this.article?.content) return
      this.summaryLoading = true
      try {
        const res = await generateSummary(this.article.content)
        if (res.code === 200 && res.data?.summary) {
          this.generatedSummary = res.data.summary
          if (this.article) {
            this.article.ai_summary = res.data.summary
          }
        }
      } catch (e) {
        uni.showToast({ title: '摘要生成失败', icon: 'none' })
      } finally {
        this.summaryLoading = false
      }
    },
    handleFileClick(file) {
      const fullUrl = getFileUrl(file.url)
      if (file.isPdf) {
        // #ifdef APP-PLUS
        plus.runtime.openURL(fullUrl)
        // #endif
        // #ifdef H5
        window.open(fullUrl, '_blank')
        // #endif
      } else {
        uni.downloadFile({
          url: fullUrl,
          success(res) {
            if (res.statusCode === 200) {
              uni.openDocument({ filePath: res.tempFilePath })
            }
          },
          fail() {
            uni.showToast({ title: '下载失败', icon: 'none' })
          }
        })
      }
    },
    goEdit() {
      uni.navigateTo({ url: `/pages/edit/index?id=${this.article.id}` })
    },
    confirmDelete() {
      if (this.deleting) return
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这篇文章吗？此操作不可恢复。',
        confirmColor: '#dd524d',
        success: (res) => {
          if (res.confirm) this.doDelete()
        }
      })
    },
    async doDelete() {
      this.deleting = true
      try {
        const res = await deleteArticle(this.article.id)
        if (res.code === 200) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => this.goHome(), 1500)
        } else {
          uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.deleting = false
      }
    },
    goHome() {
      uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const day = d.getDate()
      const h = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${y}年${m}月${day}日 ${h}:${min}`
    }
  }
}
</script>

<style scoped>
.detail {
  padding: 32rpx;
  padding-bottom: 80rpx;
}

.center-block {
  padding: 200rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
}

.muted-text {
  font-size: 28rpx;
  color: #999;
}

.error-text {
  font-size: 28rpx;
  color: #dc2626;
}

.nav-btn {
  padding: 16rpx 40rpx;
  background-color: #2563eb;
  border-radius: 12rpx;
}

.nav-btn-text {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 500;
}

.article-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.3;
  margin-bottom: 24rpx;
  letter-spacing: -0.5rpx;
}

.article-meta {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.meta-author {
  margin-left: 8rpx;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 32rpx;
}

.tag {
  font-size: 22rpx;
  color: #2563eb;
  background-color: #eff6ff;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.article-content {
  font-size: 30rpx;
  line-height: 1.8;
  color: #1a1a1a;
  margin-bottom: 40rpx;
}

.attachments {
  margin-top: 40rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.attachments-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1rpx;
  margin-bottom: 16rpx;
  display: block;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background-color: #fafafa;
  border: 1rpx solid #f0f0f0;
  border-radius: 16rpx;
}

.file-item:active {
  background-color: #eff6ff;
  border-color: #2563eb;
}

.file-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  font-size: 28rpx;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-action-hint {
  font-size: 22rpx;
  color: #999;
}

.admin-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 48rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
}

.btn-secondary {
  background-color: #f3f4f6;
}

.btn-danger {
  background-color: #fef2f2;
  border: 1rpx solid #fecaca;
}

.btn-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #374151;
}

.btn-text-danger {
  font-size: 28rpx;
  font-weight: 500;
  color: #dc2626;
}

.back-link {
  margin-top: 48rpx;
  padding: 16rpx 0;
}

.back-link-text {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

.footer {
  margin-top: 40rpx;
  padding: 32rpx 0;
  display: flex;
  justify-content: center;
}

.footer-text {
  font-size: 22rpx;
  color: #999;
}
</style>
