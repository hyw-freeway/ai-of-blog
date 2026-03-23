<template>
  <view class="md-toolbar">
    <view class="toolbar-btn" @click="emit('action', 'bold')">
      <text class="toolbar-icon">B</text>
    </view>
    <view class="toolbar-btn" @click="emit('action', 'italic')">
      <text class="toolbar-icon italic">I</text>
    </view>
    <view class="toolbar-btn" @click="emit('action', 'heading')">
      <text class="toolbar-icon">H</text>
    </view>
    <view class="toolbar-btn" @click="emit('action', 'code')">
      <text class="toolbar-icon mono">&lt;/&gt;</text>
    </view>
    <view class="toolbar-btn" @click="emit('action', 'link')">
      <text class="toolbar-icon">🔗</text>
    </view>
    <view class="toolbar-btn" @click="emit('action', 'image')">
      <text class="toolbar-icon">🖼</text>
    </view>
    <view class="toolbar-btn" @click="emit('action', 'list')">
      <text class="toolbar-icon">☰</text>
    </view>
    <view class="toolbar-btn" @click="emit('action', 'quote')">
      <text class="toolbar-icon">"</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'MarkdownToolbar',
  emits: ['action'],
  methods: {
    emit(event, action) {
      this.$emit(event, action)
    }
  }
}
</script>

<style scoped>
.md-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #e5e7eb;
  margin-bottom: 16rpx;
}

.toolbar-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background-color: #f3f4f6;
}

.toolbar-btn:active {
  background-color: #e5e7eb;
}

.toolbar-icon {
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
}

.toolbar-icon.italic {
  font-style: italic;
}

.toolbar-icon.mono {
  font-size: 22rpx;
  font-family: monospace;
}
</style>
