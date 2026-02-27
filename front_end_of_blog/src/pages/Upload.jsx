/**
 * 文章上传页
 * 包含标题、Markdown 编辑器、标签输入
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import Modal from '../components/Modal';
import { createArticle } from '../services/api';
import { isLoggedIn } from '../utils/auth';
import './Upload.css';

function Upload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleContentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      content: value || ''
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('请输入文章标题');
      return;
    }

    if (!formData.content.trim()) {
      setError('请输入文章内容');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await createArticle({
        title: formData.title.trim(),
        content: formData.content,
        tags: formData.tags.trim()
      });

      if (res.code === 200) {
        setModal({
          isOpen: true,
          title: '发布成功',
          message: '文章已成功发布！',
          type: 'alert'
        });
      } else {
        setError(res.msg || '发布失败');
      }
    } catch (err) {
      setError(err.msg || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    setModal({ isOpen: false });
    navigate('/');
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1 className="upload-title">发布新文章</h1>

        <form className="upload-form" onSubmit={handleSubmit}>
          {error && (
            <div className="message message-error">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="title" className="form-label">文章标题</label>
            <input
              type="text"
              id="title"
              name="title"
              className="input"
              value={formData.title}
              onChange={handleChange}
              placeholder="请输入文章标题"
            />
          </div>

          <div className="form-group">
            <label className="form-label">文章内容</label>
            <MarkdownEditor
              value={formData.content}
              onChange={handleContentChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">文章标签</label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="input"
              value={formData.tags}
              onChange={handleChange}
              placeholder="多个标签用逗号分隔，如：技术,React,前端"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '发布中...' : '发布文章'}
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type="alert"
        confirmText="好的"
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}

export default Upload;
