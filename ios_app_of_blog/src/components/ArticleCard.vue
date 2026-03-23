<template>
  <view class="article-card" @click="goDetail">
    <view class="card-title">
      <text v-if="!keyword">{{ article.title }}</text>
      <rich-text v-else :nodes="highlightText(article.title)" />
    </view>
    <view class="card-summary" v-if="summaryText">
      <text v-if="!keyword">{{ summaryText }}</text>
      <rich-text v-else :nodes="highlightText(summaryText)" />
    </view>
    <view class="card-meta">
      <text class="card-date">{{ formatDate(article.createTime) }}</text>
      <text class="card-author" v-if="article.author">· {{ article.author }}</text>
      <text class="card-similarity" v-if="showSimilarity && article.similarity">
        · 相关度 {{ Math.round(article.similarity * 100) }}%
      </text>
    </view>
    <view class="card-tags" v-if="article.tags">
      <text class="tag" v-for="(tag, i) in tagList" :key="i">{{ tag }}</text>
    </view>
    <view class="card-footer">
      <text class="read-more">阅读全文 →</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ArticleCard',
  props: {
    article: { type: Object, required: true },
    keyword: { type: String, default: '' },
    showSimilarity: { type: Boolean, default: false }
  },
  computed: {
    tagList() {
      if (!this.article.tags) return []
      return this.article.tags.split(',').map(t => t.trim()).filter(Boolean)
    },
    summaryText() {
      return this.article.ai_summary || this.article.summary || ''
    }
  },
  methods: {
    goDetail() {
      uni.navigateTo({ url: `/pages/article/detail?id=${this.article.id}` })
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    highlightText(text) {
      if (!this.keyword || !text) return text
      const escaped = this.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escaped})`, 'gi')
      return text.replace(regex, '<span style="background-color:#fef08a;color:#854d0e;font-weight:500;">$1</span>')
    }
  }
}
</script>

<style scoped>
.article-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid #f0f0f0;
}

.card-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 16rpx;
}

.card-summary {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.card-author {
  margin-left: 8rpx;
}

.card-similarity {
  margin-left: 8rpx;
  color: #2563eb;
  font-weight: 500;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tag {
  font-size: 22rpx;
  color: #2563eb;
  background-color: #eff6ff;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.read-more {
  font-size: 24rpx;
  color: #2563eb;
  font-weight: 500;
}
</style>
