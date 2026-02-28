/**
 * 文章详情页
 * 展示单篇文章完整内容，支持 Markdown 渲染和 PDF 预览
 * 包含侧边目录导航功能
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { marked } from 'marked';
import { getArticle, deleteArticle, getFileUrl, getSummaryStreamUrl } from '../services/api';
import { isLoggedIn, getUsername } from '../utils/auth';
import PdfViewer from '../components/PdfViewer';
import Modal from '../components/Modal';
import './ArticleDetail.css';
import '../components/AIToolbar.css';

// 清理 Markdown 格式，提取纯文本
const stripMarkdown = (text) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // 加粗
    .replace(/\*(.+?)\*/g, '$1')       // 斜体
    .replace(/__(.+?)__/g, '$1')       // 加粗
    .replace(/_(.+?)_/g, '$1')         // 斜体
    .replace(/~~(.+?)~~/g, '$1')       // 删除线
    .replace(/`(.+?)`/g, '$1')         // 行内代码
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 链接
    .replace(/!\[.*?\]\(.+?\)/g, '')   // 图片
    .trim();
};

// 生成标题 ID
const generateHeadingId = (text) => {
  const cleanText = stripMarkdown(text);
  return cleanText
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// 从 Markdown 内容中提取标题（跳过代码块）
const extractHeadings = (content) => {
  if (!content) return [];
  const headings = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  
  lines.forEach((line) => {
    // 检测代码块的开始和结束
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    
    // 跳过代码块内的内容
    if (inCodeBlock) return;
    
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    
    if (h1Match) {
      const text = h1Match[1].trim();
      const displayText = stripMarkdown(text);
      headings.push({ level: 1, text: displayText, id: generateHeadingId(text) });
    } else if (h2Match) {
      const text = h2Match[1].trim();
      const displayText = stripMarkdown(text);
      headings.push({ level: 2, text: displayText, id: generateHeadingId(text) });
    }
  });
  
  return headings;
};

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

// 自定义 marked renderer，为标题添加 id
const renderer = new marked.Renderer();
renderer.heading = function(textOrObj, level, rawText) {
  // 兼容新旧版本 marked API
  let text, depth, raw;
  if (typeof textOrObj === 'object') {
    // 新版 marked (v4+): 接收对象 { text, depth, raw }
    text = textOrObj.text;
    depth = textOrObj.depth;
    raw = textOrObj.raw;
  } else {
    // 旧版 marked: 接收 (text, level, raw)
    text = textOrObj;
    depth = level;
    raw = rawText;
  }
  // 使用 raw 去除 # 前缀后生成 ID，确保与 extractHeadings 一致
  const rawTitle = (raw || '').replace(/^#+\s*/, '').trim();
  const id = generateHeadingId(rawTitle || text);
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
  renderer: renderer,
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
  
  const [streamingSummary, setStreamingSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [activeHeading, setActiveHeading] = useState('');
  const eventSourceRef = useRef(null);
  const contentRef = useRef(null);

  const loggedIn = isLoggedIn();
  const currentUser = getUsername();

  // 使用 useMemo 缓存渲染结果
  const renderedContent = useMemo(() => {
    if (!article?.content) return '';
    return marked(article.content);
  }, [article?.content]);

  // 提取标题列表
  const headings = useMemo(() => {
    if (!article?.content) return [];
    return extractHeadings(article.content);
  }, [article?.content]);

  // 滚动监听，高亮当前可见的标题
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      let currentHeading = '';
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element && element.offsetTop <= scrollPosition) {
          currentHeading = heading.id;
        }
      }
      setActiveHeading(currentHeading);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  // 点击导航项滚动到对应位置
  const scrollToHeading = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    fetchArticle();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [id]);

  const startSummaryStream = (regenerate = false) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setIsGeneratingSummary(true);
    setStreamingSummary('');
    setSummaryError(null);
    
    const url = getSummaryStreamUrl(id, regenerate);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setSummaryError(data.error);
          setIsGeneratingSummary(false);
          eventSource.close();
          return;
        }
        
        if (data.cached && data.content) {
          setStreamingSummary(data.content);
          setArticle(prev => ({ ...prev, ai_summary: data.content }));
          setIsGeneratingSummary(false);
          eventSource.close();
          return;
        }
        
        if (data.content) {
          setStreamingSummary(prev => prev + data.content);
        }
        
        if (data.done) {
          if (data.summary) {
            setArticle(prev => ({ ...prev, ai_summary: data.summary }));
          }
          setIsGeneratingSummary(false);
          eventSource.close();
        }
      } catch (e) {
        console.error('解析 SSE 数据失败:', e);
      }
    };
    
    eventSource.onerror = () => {
      setSummaryError('连接中断，请重试');
      setIsGeneratingSummary(false);
      eventSource.close();
    };
  };

  const handleRegenerateSummary = () => {
    startSummaryStream(true);
  };

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
        if (!res.data.ai_summary && res.data.content && res.data.content.length >= 50) {
          setTimeout(() => startSummaryStream(false), 100);
        }
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
    <div className={`article-detail ${headings.length > 0 ? 'has-toc' : ''}`}>
      {/* 侧边目录导航 */}
      {headings.length > 0 && (
        <aside className="article-toc">
          <div className="toc-wrapper">
            <h4 className="toc-title">目录</h4>
            <nav className="toc-nav">
              {headings.map((heading) => (
                <button
                  key={heading.id}
                  className={`toc-item toc-level-${heading.level} ${activeHeading === heading.id ? 'active' : ''}`}
                  onClick={() => scrollToHeading(heading.id)}
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      )}

      <article className="detail-content" ref={contentRef}>
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

        {(article.ai_summary || streamingSummary || isGeneratingSummary) && (
          <div className="ai-summary-card">
            <div className="ai-summary-header">
              <span className="ai-badge">
                {isGeneratingSummary ? 'AI 生成中...' : 'AI 摘要'}
              </span>
              <button 
                className="ai-regenerate-btn"
                onClick={handleRegenerateSummary}
                disabled={isGeneratingSummary}
                title="重新生成摘要"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                {isGeneratingSummary ? '' : '重新生成'}
              </button>
            </div>
            {summaryError ? (
              <p className="ai-summary-error">{summaryError}</p>
            ) : (
              <p className={isGeneratingSummary ? 'ai-summary-streaming' : ''}>
                {streamingSummary || article.ai_summary}
                {isGeneratingSummary && <span className="typing-cursor">|</span>}
              </p>
            )}
          </div>
        )}
        
        {!article.ai_summary && !streamingSummary && !isGeneratingSummary && article.content?.length >= 50 && (
          <div className="ai-summary-card ai-summary-empty">
            <button 
              className="ai-generate-btn"
              onClick={() => startSummaryStream(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              生成 AI 摘要
            </button>
          </div>
        )}

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
