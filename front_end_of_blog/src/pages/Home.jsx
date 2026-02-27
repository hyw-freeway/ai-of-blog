/**
 * 首页 - 文章列表
 * 展示所有已发布的文章，支持搜索
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getArticles, getFileUrl } from '../services/api';
import './Home.css';

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

function Home() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [fileMenu, setFileMenu] = useState({ show: false, file: null, x: 0, y: 0 });

  useEffect(() => {
    fetchArticles();
  }, [searchKeyword]);

  // 点击其他地方关闭文件菜单
  useEffect(() => {
    const handleClickOutside = () => setFileMenu({ show: false, file: null, x: 0, y: 0 });
    if (fileMenu.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [fileMenu.show]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getArticles(searchKeyword);
      if (res.code === 200) {
        setArticles(res.data || []);
      } else {
        setError(res.msg || '获取文章失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchKeyword(keyword.trim());
  };

  const handleClearSearch = () => {
    setKeyword('');
    setSearchKeyword('');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderTags = (tags) => {
    if (!tags) return null;
    return tags.split(',').map((tag, index) => (
      <span key={index} className="tag">{tag.trim()}</span>
    ));
  };

  const highlightText = (text, keyword) => {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="highlight">{part}</mark> : part
    );
  };

  // 处理卡片点击（进入详情页）
  const handleCardClick = (e, articleId) => {
    // 如果点击的是文件项或链接，不跳转
    if (e.target.closest('.article-file-item') || e.target.closest('a')) {
      return;
    }
    navigate(`/article/${articleId}`);
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

  // 获取完整文件 URL
  const getFullFileUrl = (url) => {
    if (!url) return '';
    // 如果已经是完整 URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // 否则拼接 API 基础地址
    return getFileUrl(url);
  };

  // 下载文件（强制下载）
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
      window.open(getFullFileUrl(fileMenu.file.url), '_blank');
    }
    setFileMenu({ show: false, file: null, x: 0, y: 0 });
  };

  // 渲染图片预览
  const renderImagePreview = (images) => {
    if (!images || images.length === 0) return null;

    const maxDisplay = 3;
    const displayImages = images.slice(0, maxDisplay);
    const extraCount = images.length - maxDisplay;

    return (
      <div className="article-images">
        {displayImages.map((img, index) => (
          <div key={index} className="article-image-item">
            <img src={img} alt="" loading="lazy" />
          </div>
        ))}
        {extraCount > 0 && (
          <div className="article-image-more">
            +{extraCount}
          </div>
        )}
      </div>
    );
  };

  // 渲染文件列表
  const renderFileList = (files) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="article-files">
        {files.map((file, index) => (
          <div 
            key={index} 
            className="article-file-item"
            onClick={(e) => handleFileClick(e, file)}
            title="点击查看操作"
          >
            <span className="file-icon">{getFileIcon(file.name)}</span>
            <span className="file-name">{file.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="home">
      <header className="home-header">
        <h1>欢迎来到我的博客</h1>
        <p>记录技术、分享思考</p>
      </header>

      {/* 搜索框 */}
      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <input
            type="text"
            className="input search-input"
            placeholder="搜索文章标题或内容..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setKeyword('')}
              aria-label="清除"
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary search-btn">
          搜索
        </button>
        {searchKeyword && (
          <button
            type="button"
            className="btn btn-secondary search-btn"
            onClick={handleClearSearch}
          >
            清除
          </button>
        )}
      </form>

      {/* 搜索结果提示 */}
      {searchKeyword && !loading && (
        <div className="search-result-info">
          搜索 "<strong>{searchKeyword}</strong>" 找到 {articles.length} 篇文章
        </div>
      )}

      {loading ? (
        <div className="home-loading">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      ) : error ? (
        <div className="home-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchArticles}>
            重试
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="home-empty">
          {searchKeyword ? (
            <>
              <p>未找到相关文章</p>
              <button className="btn btn-secondary" onClick={handleClearSearch}>
                查看全部文章
              </button>
            </>
          ) : (
            <p>暂无文章</p>
          )}
        </div>
      ) : (
        <div className="article-list">
          {articles.map((article) => {
            const hasImages = article.images && article.images.length > 0;
            
            return (
              <article 
                key={article.id} 
                className={`article-card card ${hasImages ? 'has-images' : ''}`}
                onClick={(e) => handleCardClick(e, article.id)}
              >
                <div className="article-card-content">
                  <h2 className="article-title">
                    {searchKeyword ? highlightText(article.title, searchKeyword) : article.title}
                  </h2>
                  
                  <div className="article-meta">
                    <span className="article-date">{formatDate(article.createTime)}</span>
                    {article.author && (
                      <span className="article-author">· {article.author}</span>
                    )}
                  </div>

                  {article.tags && (
                    <div className="article-tags">
                      {renderTags(article.tags)}
                    </div>
                  )}

                  {article.summary && (
                    <p className="article-summary">
                      {searchKeyword ? highlightText(article.summary, searchKeyword) : article.summary}
                      {article.summary.length >= 150 && '...'}
                    </p>
                  )}

                  {/* 文件展示 */}
                  {renderFileList(article.files)}

                  <span className="article-read-more">
                    阅读全文 →
                  </span>
                </div>

                {/* 图片预览 - 放在右侧 */}
                {renderImagePreview(article.images)}
              </article>
            );
          })}
        </div>
      )}

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
            在线预览
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

export default Home;
