<template>
  <view class="webview-page">
    <web-view :src="url" />
  </view>
</template>

<script>
export default {
  data() {
    return {
      url: 'https://i.finka.cn/hd/app/login?source_channel=OFFICIAL_WEBSITE#/home'
    }
  },
  onLoad(options) {
    if (options.url) {
      this.url = decodeURIComponent(options.url)
    }
    if (options.title) {
      uni.setNavigationBarTitle({ title: decodeURIComponent(options.title) })
    }
  }
}
</script>

<style scoped>
.webview-page {
  width: 100%;
  height: 100vh;
}
</style>
