<template>
  <view class="scroll-nav" v-if="visible">
    <view
      v-if="!atTop"
      class="scroll-nav-btn"
      @click="goTop"
    >
      <text class="scroll-nav-icon">↑</text>
    </view>
    <view
      v-if="!atBottom"
      class="scroll-nav-btn"
      @click="goBottom"
    >
      <text class="scroll-nav-icon">↓</text>
    </view>
  </view>
</template>

<script>
/**
 * 页面滚动导航：一键回顶部 / 一键到底部
 *
 * 因为 uniapp 的 onPageScroll 必须写在页面级别，不能在子组件里监听，
 * 所以本组件接收 props：
 *   - scrollTop  当前页面滚动距离（来自页面 onPageScroll）
 *   - bottomThreshold  距底部多少 px 视为"接近底部"（默认 100）
 *
 * 页面用法：
 *   <ScrollNav :scrollTop="scrollTop" />
 *   onPageScroll(e) { this.scrollTop = e.scrollTop }
 */
export default {
  name: 'ScrollNav',
  props: {
    scrollTop: { type: Number, default: 0 },
    showThreshold: { type: Number, default: 200 },
    bottomThreshold: { type: Number, default: 100 }
  },
  data() {
    return {
      windowHeight: 0,
      pageHeight: 0
    }
  },
  computed: {
    distanceToBottom() {
      return Math.max(0, this.pageHeight - this.windowHeight - this.scrollTop)
    },
    atTop() {
      return this.scrollTop <= this.bottomThreshold
    },
    atBottom() {
      return this.distanceToBottom <= this.bottomThreshold
    },
    visible() {
      return this.scrollTop > this.showThreshold || this.distanceToBottom > this.showThreshold
    }
  },
  mounted() {
    this.measure()
  },
  methods: {
    measure() {
      try {
        const sys = uni.getSystemInfoSync()
        this.windowHeight = sys.windowHeight || 0
      } catch (e) {}
      this.queryPageHeight()
    },
    queryPageHeight() {
      // 通过 selectorQuery 拿 body 高度（等渲染稳定）
      setTimeout(() => {
        const query = uni.createSelectorQuery().in(this)
        query.selectViewport().scrollOffset(res => {
          if (res && typeof res.scrollHeight === 'number') {
            this.pageHeight = res.scrollHeight
          }
        }).exec()
      }, 200)
    },
    goTop() {
      uni.pageScrollTo({ scrollTop: 0, duration: 300 })
    },
    goBottom() {
      // 取一个足够大的值，uni.pageScrollTo 会自动夹到页面底部
      this.queryPageHeight()
      const target = this.pageHeight > 0 ? this.pageHeight : 999999
      uni.pageScrollTo({ scrollTop: target, duration: 300 })
    }
  }
}
</script>

<style scoped>
.scroll-nav {
  position: fixed;
  right: 32rpx;
  bottom: 80rpx;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.scroll-nav-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #ffffff;
  border: 1rpx solid #e5e7eb;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scroll-nav-btn:active {
  background-color: #1a1a1a;
  border-color: #1a1a1a;
}

.scroll-nav-btn:active .scroll-nav-icon {
  color: #ffffff;
}

.scroll-nav-icon {
  font-size: 36rpx;
  font-weight: 600;
  color: #374151;
  line-height: 1;
}
</style>
