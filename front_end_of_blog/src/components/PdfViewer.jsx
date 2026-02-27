/**
 * PDF 在线预览组件
 * 使用 iframe 嵌入 PDF 文件
 */
import { useState } from 'react';
import './PdfViewer.css';

function PdfViewer({ url, title, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-header">
          <h3 className="pdf-viewer-title">{title || 'PDF 预览'}</h3>
          <div className="pdf-viewer-actions">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              新窗口打开
            </a>
            <a
              href={url}
              download
              className="btn btn-secondary btn-sm"
            >
              下载
            </a>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
        
        <div className="pdf-viewer-content">
          {loading && !error && (
            <div className="pdf-loading">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          )}
          
          {error && (
            <div className="pdf-error">
              <p>PDF 加载失败</p>
              <a href={url} target="_blank" rel="noopener noreferrer">
                点击这里在新窗口打开
              </a>
            </div>
          )}
          
          <iframe
            src={url}
            title={title || 'PDF 预览'}
            className="pdf-iframe"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default PdfViewer;
