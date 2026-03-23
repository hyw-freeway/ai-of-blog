<template>
  <view class="faq-section">
    <view class="faq-header">
      <text class="faq-title">常见问题</text>
      <text class="faq-badge">AI 生成</text>
    </view>

    <!-- 加载状态 -->
    <view class="faq-loading" v-if="loading">
      <text class="faq-loading-text">正在生成常见问题...</text>
    </view>

    <!-- FAQ 列表 -->
    <view class="faq-list" v-else-if="items && items.length > 0">
      <view
        class="faq-item"
        v-for="(item, index) in items"
        :key="index"
        :class="{ 'is-open': openIndex === index }"
      >
        <view class="faq-question" @click="toggle(index)">
          <text class="question-text">{{ item.q }}</text>
          <text class="arrow">{{ openIndex === index ? '▲' : '▼' }}</text>
        </view>
        <view class="faq-answer" v-if="openIndex === index">
          <text class="answer-text">{{ item.a }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'FaqAccordion',
  props: {
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },
  data() {
    return { openIndex: null }
  },
  methods: {
    toggle(index) {
      this.openIndex = this.openIndex === index ? null : index
    }
  }
}
</script>

<style scoped>
.faq-section {
  margin-top: 40rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.faq-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.faq-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.faq-badge {
  font-size: 22rpx;
  font-weight: 500;
  color: #2563eb;
  background-color: #eff6ff;
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
}

.faq-loading {
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border-radius: 16rpx;
}

.faq-loading-text {
  font-size: 26rpx;
  color: #999;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.faq-item {
  background-color: #fafafa;
  border: 1rpx solid #f0f0f0;
  border-radius: 16rpx;
  overflow: hidden;
}

.faq-item.is-open {
  border-color: #2563eb;
  background-color: #ffffff;
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  gap: 24rpx;
}

.question-text {
  flex: 1;
  font-size: 28rpx;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.5;
}

.arrow {
  font-size: 22rpx;
  color: #999;
  flex-shrink: 0;
}

.faq-item.is-open .arrow {
  color: #2563eb;
}

.faq-answer {
  padding: 0 32rpx 28rpx;
}

.answer-text {
  font-size: 26rpx;
  line-height: 1.7;
  color: #666;
}
</style>
