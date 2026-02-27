/**
 * 文章详情页
 * 展示单篇文章完整内容，支持 Markdown 渲染和 PDF 预览
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import { getArticle, deleteArticle, getFileUrl } from '../services/api';
import { isLoggedIn, getUsername } from '../utils/auth';
import PdfViewer from '../components/PdfViewer';
import Modal from '../components/Modal';
import './ArticleDetail.css';

// 文件图标 SVG
const FileIcons = {
  pdf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M9 15h6"/>
      <path d="M9 11h6"/>
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  xls: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <rect x="8" y="12" width="8" height="6" rx="1"/>
    </svg>
  ),
  zip: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M12 11v6"/>
      <path d="M9 14h6"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
};

// 获取文件图标
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileIcons.pdf;
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return FileIcons.doc;
  if (['xls', 'xlsx'].includes(ext)) return FileIcons.xls;
  if (['zip', 'rar', '7z'].includes(ext)) return FileIcons.zip;
  return FileIcons.default;
};

// 从内容中提取文件
const extractFiles = (content) => {
  if (!content) return [];
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const files = [];
  
  const imageUrls = new Set();
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    imageUrls.add(match[1]);
  }
  
  // 文件扩展名
  const fileExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md|zip|rar|7z)$/i;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2];
    const name = match[1].replace(/^[📄📎]\s?/, '').trim();
    // 只保留文件链接
    if (!imageUrls.has(url) && fileExtensions.test(url)) {
      const isPdf = url.toLowerCase().endsWith('.pdf');
      files.push({ name, url, isPdf });
    }
  }
  return files;
};

// 获取完整文件 URL
const getFullFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return getFileUrl(url);
};

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pdfModal, setPdfModal] = useState({ show: false, url: '', title: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  const [fileMenu, setFileMenu] = useState({ show: false, file: null, x: 0, y: 0 });

  const loggedIn = isLoggedIn();
  const currentUser = getUsername();

  // 使用 useMemo 缓存渲染结果
  const renderedContent = useMemo(() => {
    if (!article?.content) return '';
    return marked(article.content);
  }, [article?.content]);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  // 点击其他地方关闭文件菜单
  useEffect(() => {
    const handleClickOutside = () => setFileMenu({ show: false, file: null, x: 0, y: 0 });
    if (fileMenu.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [fileMenu.show]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const res = await getArticle(id);
      if (res.code === 200) {
        setArticle(res.data);
      } else {
        setError(res.msg || '文章不存在');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTags = (tags) => {
    if (!tags) return null;
    return tags.split(',').map((tag, index) => (
      <span key={index} className="tag">{tag.trim()}</span>
    ));
  };

  const handleDeleteClick = () => {
    setConfirmModal({
      isOpen: true,
      title: '确认删除',
      message: '确定要删除这篇文章吗？此操作不可恢复。'
    });
  };

  const handleDeleteConfirm = async () => {
    setConfirmModal({ isOpen: false });
    
    try {
      setDeleting(true);
      const res = await deleteArticle(id);
      if (res.code === 200) {
        setAlertModal({
          isOpen: true,
          title: '删除成功',
          message: '文章已成功删除！'
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: '删除失败',
          message: res.msg || '删除失败，请稍后重试'
        });
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: '删除失败',
        message: '网络错误，请稍后重试'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleAlertConfirm = () => {
    setAlertModal({ isOpen: false });
    if (alertModal.title === '删除成功') {
      navigate('/');
    }
  };

  // 处理文件点击
  const handleFileClick = (e, file) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setFileMenu({
      show: true,
      file,
      x: rect.left,
      y: rect.bottom + 4
    });
  };

  // 下载文件
  const handleDownload = async () => {
    if (fileMenu.file) {
      try {
        const url = getFullFileUrl(fileMenu.file.url);
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileMenu.file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('下载失败:', err);
      }
    }
    setFileMenu({ show: false, file: null, x: 0, y: 0 });
  };

  // 预览文件
  const handlePreview = () => {
    if (fileMenu.file) {
      if (fileMenu.file.isPdf) {
        setPdfModal({
          show: true,
          url: getFullFileUrl(fileMenu.file.url),
          title: fileMenu.file.name
        });
      } else {
        window.open(getFullFileUrl(fileMenu.file.url), '_blank');
      }
    }
    setFileMenu({ show: false, file: null, x: 0, y: 0 });
  };

  // 渲染文件列表
  const renderFileList = (content) => {
    const files = extractFiles(content);
    if (files.length === 0) return null;

    return (
      <div className="detail-files">
        <h4 className="detail-files-title">附件</h4>
        <div className="detail-files-list">
          {files.map((file, index) => (
            <div 
              key={index} 
              className="detail-file-item"
              onClick={(e) => handleFileClick(e, file)}
            >
              <span className="file-icon">{getFileIcon(file.name)}</span>
              <span className="file-name">{file.name}</span>
              <span className="file-action-hint">点击操作</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canEdit = loggedIn && article && article.author === currentUser;

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-error">
        <p>{error}</p>
        <Link to="/" className="btn btn-primary">返回首页</Link>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="article-detail">
      <article className="detail-content">
        <header className="detail-header">
          <h1 className="detail-title">{article.title}</h1>
          
          <div className="detail-meta">
            <span className="detail-date">{formatDate(article.createTime)}</span>
            {article.author && (
              <span className="detail-author">· {article.author}</span>
            )}
          </div>

          {article.tags && (
            <div className="detail-tags">
              {renderTags(article.tags)}
            </div>
          )}
        </header>

        <div 
          className="article-content markdown-body"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />

        {/* 附件列表 */}
        {renderFileList(article.content)}

        {canEdit && (
          <div className="detail-actions">
            <Link to={`/edit/${article.id}`} className="btn btn-secondary">
              编辑文章
            </Link>
            <button 
              className="btn btn-danger" 
              onClick={handleDeleteClick}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '删除文章'}
            </button>
          </div>
        )}
      </article>

      <div className="detail-nav">
        <Link to="/" className="back-link">← 返回文章列表</Link>
      </div>

      {/* PDF 预览弹窗 */}
      {pdfModal.show && (
        <PdfViewer
          url={pdfModal.url}
          title={pdfModal.title}
          onClose={() => setPdfModal({ show: false, url: '', title: '' })}
        />
      )}

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type="confirm"
        confirmText="确认删除"
        cancelText="取消"
        danger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />

      {/* 提示弹窗 */}
      <Modal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type="alert"
        confirmText="好的"
        onConfirm={handleAlertConfirm}
      />

      {/* 文件操作菜单 */}
      {fileMenu.show && fileMenu.file && (
        <div 
          className="file-action-menu"
          style={{ left: fileMenu.x, top: fileMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="file-action-btn" onClick={handlePreview}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            {fileMenu.file.isPdf ? '在线预览' : '打开文件'}
          </button>
          <button className="file-action-btn" onClick={handleDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            下载文件
          </button>
        </div>
      )}
    </div>
  );
}

export default ArticleDetail;
