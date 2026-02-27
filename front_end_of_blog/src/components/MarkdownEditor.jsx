/**
 * Markdown 编辑器组件
 * 使用 EasyMDE 编辑器
 */
import { useState, useMemo, useCallback } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import { uploadImage, uploadFile, getFileUrl } from '../services/api';
import Modal from './Modal';
import './MarkdownEditor.css';

function MarkdownEditor({ value, onChange }) {
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  // 处理内容变化
  const handleChange = useCallback((val) => {
    if (onChange) {
      onChange(val);
    }
  }, [onChange]);

  // EasyMDE 配置
  const options = useMemo(() => ({
    autofocus: false,
    spellChecker: false,
    placeholder: '请输入文章内容...',
    status: ['lines', 'words'],
    sideBySideFullscreen: false,
    toolbar: [
      'bold', 'italic', 'heading', '|',
      'quote', 'unordered-list', 'ordered-list', '|',
      'link',
      {
        name: 'upload-image',
        action: (editor) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
              const res = await uploadImage(file);
              if (res.code === 200) {
                const fileUrl = getFileUrl(res.data.url);
                const markdownImg = `![${res.data.originalName}](${fileUrl})`;
                const cm = editor.codemirror;
                const cursor = cm.getCursor();
                cm.replaceRange(markdownImg, cursor);
                cm.focus();
              } else {
                alert(res.msg || '图片上传失败');
              }
            } catch (err) {
              alert('网络错误，请重试');
            }
          };
          input.click();
        },
        className: 'fa fa-image',
        title: '上传图片',
      },
      {
        name: 'upload-file',
        action: (editor) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.rar';
          input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            try {
              const res = await uploadFile(file);
              if (res.code === 200) {
                const fileUrl = getFileUrl(res.data.url);
                const markdownLink = `[${res.data.originalName}](${fileUrl})`;
                const cm = editor.codemirror;
                const cursor = cm.getCursor();
                cm.replaceRange(markdownLink, cursor);
                cm.focus();
              } else {
                alert(res.msg || '文件上传失败');
              }
            } catch (err) {
              alert('网络错误，请重试');
            }
          };
          input.click();
        },
        className: 'fa fa-paperclip',
        title: '上传文件',
      },
      '|',
      'side-by-side', 'preview', 'fullscreen', '|',
      'guide'
    ],
  }), []);

  return (
    <div className="markdown-editor-wrapper">
      <SimpleMDE
        value={value}
        onChange={handleChange}
        options={options}
      />
      
      <p className="editor-hint">
        支持 Markdown 语法 | 点击工具栏 🖼 上传图片 | 点击 📎 上传文件
      </p>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type="alert"
        confirmText="好的"
        onConfirm={() => setModal({ isOpen: false })}
      />
    </div>
  );
}

export default MarkdownEditor;
