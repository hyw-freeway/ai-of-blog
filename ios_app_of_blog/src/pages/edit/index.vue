<template>
  <view class="edit-page">
    <view class="loading" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else>
      <!-- 标题 -->
      <view class="form-group">
        <text class="form-label">文章标题</text>
        <input
          class="form-input"
          type="text"
          placeholder="请输入标题"
          v-model="title"
        />
      </view>

      <!-- 标签 -->
      <view class="form-group">
        <text class="form-label">标签</text>
        <input
          class="form-input"
          type="text"
          placeholder="多个标签用逗号分隔"
          v-model="tags"
        />
      </view>

      <!-- Markdown 工具栏 -->
      <MarkdownToolbar @action="onToolbarAction" />

      <!-- 内容编辑器 -->
      <view class="form-group">
        <text class="form-label">文章内容 (Markdown)</text>
        <textarea
          class="editor-textarea"
          placeholder="在此编写 Markdown 内容..."
          v-model="content"
          :maxlength="-1"
          auto-height
          :style="{ minHeight: '500rpx' }"
        />
      </view>

      <!-- 上传操作 -->
      <view class="form-group upload-actions">
        <view class="upload-btn" @click="chooseImage">
          <text class="upload-btn-text">📷 上传图片</text>
        </view>
        <view class="upload-btn" @click="chooseFile">
          <text class="upload-btn-text">📎 上传文件</text>
        </view>
      </view>

      <!-- AI 工具 -->
      <view class="ai-tools">
        <view class="ai-btn" @click="aiGenerateTags">
          <text class="ai-btn-text">🏷 AI 生成标签</text>
        </view>
        <view class="ai-btn" @click="aiProofread">
          <text class="ai-btn-text">✏️ AI 纠错</text>
        </view>
      </view>

      <!-- 保存按钮 -->
      <view class="submit-btn" :class="{ disabled: submitting }" @click="doUpdate">
        <text class="submit-btn-text">{{ submitting ? '保存中...' : '保存修改' }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getArticle, updateArticle, uploadImage, uploadFile, generateTags, proofreadContent } from '../../services/api'
import { isLoggedIn } from '../../utils/auth'
import MarkdownToolbar from '../../components/MarkdownToolbar.vue'

export default {
  components: { MarkdownToolbar },
  data() {
    return {
      articleId: null,
      title: '',
      content: '',
      tags: '',
      loading: true,
      submitting: false
    }
  },
  onLoad(options) {
    if (!isLoggedIn()) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => uni.redirectTo({ url: '/pages/login/index' }), 1000)
      return
    }
    this.articleId = options.id
    this.fetchArticle()
  },
  methods: {
    async fetchArticle() {
      this.loading = true
      try {
        const res = await getArticle(this.articleId)
        if (res.code === 200 && res.data) {
          this.title = res.data.title || ''
          this.content = res.data.content || ''
          this.tags = res.data.tags || ''
        } else {
          uni.showToast({ title: '文章不存在', icon: 'none' })
          setTimeout(() => uni.navigateBack(), 1500)
        }
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    onToolbarAction(action) {
      const insertions = {
        bold: '**粗体文字**',
        italic: '*斜体文字*',
        heading: '\n## 标题\n',
        code: '\n```\n代码\n```\n',
        link: '[链接文字](URL)',
        image: '![图片描述](URL)',
        list: '\n- 列表项\n- 列表项\n',
        quote: '\n> 引用文字\n'
      }
      if (insertions[action]) {
        this.content += insertions[action]
      }
    },
    async chooseImage() {
      try {
        const res = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject
          })
        })
        uni.showLoading({ title: '上传中...' })
        const uploadRes = await uploadImage(res.tempFilePaths[0])
        uni.hideLoading()
        if (uploadRes.code === 200 && uploadRes.data?.url) {
          this.content += `\n![图片](${uploadRes.data.url})\n`
          uni.showToast({ title: '插入成功', icon: 'success' })
        } else {
          uni.showToast({ title: '上传失败', icon: 'none' })
        }
      } catch (e) {
        uni.hideLoading()
      }
    },
    async chooseFile() {
      // #ifdef APP-PLUS
      try {
        const res = await new Promise((resolve, reject) => {
          uni.chooseFile({
            count: 1,
            success: resolve,
            fail: reject
          })
        })
        uni.showLoading({ title: '上传中...' })
        const uploadRes = await uploadFile(res.tempFilePaths[0])
        uni.hideLoading()
        if (uploadRes.code === 200 && uploadRes.data?.url) {
          const name = res.tempFiles?.[0]?.name || '文件'
          this.content += `\n[${name}](${uploadRes.data.url})\n`
          uni.showToast({ title: '插入成功', icon: 'success' })
        } else {
          uni.showToast({ title: '上传失败', icon: 'none' })
        }
      } catch (e) {
        uni.hideLoading()
      }
      // #endif
      // #ifdef H5
      uni.showToast({ title: '文件上传请使用 App 端', icon: 'none' })
      // #endif
    },
    async aiGenerateTags() {
      if (!this.content || this.content.trim().length < 20) {
        uni.showToast({ title: '内容太短', icon: 'none' })
        return
      }
      uni.showLoading({ title: 'AI 生成中...' })
      try {
        const res = await generateTags(this.title, this.content)
        if (res.code === 200 && res.data?.tags) {
          const newTags = res.data.tags
          this.tags = this.tags ? `${this.tags},${newTags}` : newTags
          uni.showToast({ title: '标签已生成', icon: 'success' })
        }
      } catch (e) {
        uni.showToast({ title: '生成失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    async aiProofread() {
      if (!this.content || this.content.trim().length < 10) {
        uni.showToast({ title: '内容太短', icon: 'none' })
        return
      }
      uni.showLoading({ title: 'AI 纠错中...' })
      try {
        const res = await proofreadContent(this.content)
        if (res.code === 200 && res.data?.corrected) {
          this.content = res.data.corrected
          uni.showToast({ title: '纠错完成', icon: 'success' })
        }
      } catch (e) {
        uni.showToast({ title: '纠错失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    async doUpdate() {
      if (this.submitting) return
      if (!this.title.trim()) {
        uni.showToast({ title: '请输入标题', icon: 'none' })
        return
      }
      if (!this.content.trim()) {
        uni.showToast({ title: '请输入内容', icon: 'none' })
        return
      }
      this.submitting = true
      try {
        const res = await updateArticle(this.articleId, {
          title: this.title,
          content: this.content,
          tags: this.tags
        })
        if (res.code === 200) {
          uni.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1500)
        } else {
          uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.edit-page {
  padding: 24rpx 32rpx;
  padding-bottom: 80rpx;
}

.loading {
  padding: 200rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.form-group {
  margin-bottom: 28rpx;
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
  background-color: #ffffff;
  border: 1rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1a1a1a;
  box-sizing: border-box;
}

.editor-textarea {
  width: 100%;
  background-color: #ffffff;
  border: 1rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: #1a1a1a;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  box-sizing: border-box;
}

.upload-actions {
  display: flex;
  gap: 16rpx;
}

.upload-btn {
  display: inline-flex;
  padding: 16rpx 28rpx;
  background-color: #f3f4f6;
  border-radius: 12rpx;
}

.upload-btn:active {
  background-color: #e5e7eb;
}

.upload-btn-text {
  font-size: 26rpx;
  color: #374151;
}

.ai-tools {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.ai-btn {
  padding: 16rpx 24rpx;
  background-color: #eff6ff;
  border: 1rpx solid #bfdbfe;
  border-radius: 12rpx;
}

.ai-btn:active {
  opacity: 0.8;
}

.ai-btn-text {
  font-size: 24rpx;
  color: #2563eb;
  font-weight: 500;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background-color: #2563eb;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:active {
  opacity: 0.85;
}

.submit-btn.disabled {
  opacity: 0.6;
}

.submit-btn-text {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
