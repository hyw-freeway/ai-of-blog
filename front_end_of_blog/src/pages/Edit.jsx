/**
 * 文章编辑页
 * 编辑已发布的文章，支持 AI 功能
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownEditor from '../components/MarkdownEditor';
import AIToolbar from '../components/AIToolbar';
import Modal from '../components/Modal';
import { getArticle, updateArticle } from '../services/api';
import { isLoggedIn } from '../utils/auth';
import './Upload.css';

function Edit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    fetchArticle();
  }, [id, navigate]);

  const fetchArticle = async () => {
    try {
      setFetching(true);
      const res = await getArticle(id);
      if (res.code === 200) {
        setFormData({
          title: res.data.title || '',
          content: res.data.content || '',
          tags: res.data.tags || ''
        });
      } else {
        setError(res.msg || '文章不存在');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setFetching(false);
    }
  };

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

  const handleTagsGenerated = (tags) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags ? `${prev.tags},${tags}` : tags
    }));
  };

  const handleContentCorrected = (corrected) => {
    setFormData(prev => ({
      ...prev,
      content: corrected
    }));
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

      const res = await updateArticle(id, {
        title: formData.title.trim(),
        content: formData.content,
        tags: formData.tags.trim()
      });

      if (res.code === 200) {
        setModal({
          isOpen: true,
          title: '更新成功',
          message: '文章已成功更新！'
        });
      } else {
        setError(res.msg || '更新失败');
      }
    } catch (err) {
      setError(err.msg || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    setModal({ isOpen: false });
    navigate(`/article/${id}`);
  };

  if (fetching) {
    return (
      <div className="upload-page">
        <div className="upload-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1 className="upload-title">编辑文章</h1>

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
            <label className="form-label">AI 助手</label>
            <AIToolbar
              title={formData.title}
              content={formData.content}
              onTagsGenerated={handleTagsGenerated}
              onContentCorrected={handleContentCorrected}
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
            <p className="form-hint">可使用上方「AI 生成标签」按钮自动生成</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/article/${id}`)}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '更新中...' : '更新文章'}
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

export default Edit;
