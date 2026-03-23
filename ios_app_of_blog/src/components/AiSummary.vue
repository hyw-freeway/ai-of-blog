<template>
  <view class="ai-summary" v-if="summary || loading">
    <view class="summary-header">
      <text class="summary-badge">{{ loading ? 'AI 生成中...' : 'AI 摘要' }}</text>
      <view class="regenerate-btn" v-if="!loading && showRegenerate" @click="$emit('regenerate')">
        <text class="regenerate-text">重新生成</text>
      </view>
    </view>
    <view class="summary-loading" v-if="loading">
      <text class="summary-loading-text">正在生成摘要...</text>
    </view>
    <text class="summary-text" v-else>{{ summary }}</text>
  </view>
  <view class="ai-summary-empty" v-else-if="showGenerate">
    <view class="generate-btn" @click="$emit('generate')">
      <text class="generate-btn-text">生成 AI 摘要</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AiSummary',
  props: {
    summary: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    showRegenerate: { type: Boolean, default: false },
    showGenerate: { type: Boolean, default: false }
  },
  emits: ['regenerate', 'generate']
}
</script>

<style scoped>
.ai-summary {
  background-color: #f8fafc;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 32rpx;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.summary-badge {
  font-size: 22rpx;
  font-weight: 600;
  color: #2563eb;
  background-color: #eff6ff;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.regenerate-btn {
  padding: 6rpx 16rpx;
}

.regenerate-text {
  font-size: 22rpx;
  color: #2563eb;
}

.summary-loading {
  padding: 16rpx 0;
}

.summary-loading-text {
  font-size: 26rpx;
  color: #999;
}

.summary-text {
  font-size: 28rpx;
  color: #475569;
  line-height: 1.7;
}

.ai-summary-empty {
  margin-bottom: 32rpx;
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background-color: #f8fafc;
  border: 1rpx dashed #e2e8f0;
  border-radius: 16rpx;
}

.generate-btn:active {
  background-color: #eff6ff;
}

.generate-btn-text {
  font-size: 28rpx;
  color: #2563eb;
  font-weight: 500;
}
</style>
