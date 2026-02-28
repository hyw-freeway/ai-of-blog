/**
 * AI 工具栏组件
 * 提供 AI 标签生成和语法纠错功能
 */
import { useState } from 'react';
import { generateTags, proofreadContent } from '../services/api';
import './AIToolbar.css';

function AIToolbar({ 
  title, 
  content, 
  onTagsGenerated, 
  onContentCorrected,
  showTagsButton = true,
  showProofreadButton = true 
}) {
  const [tagsLoading, setTagsLoading] = useState(false);
  const [proofreadLoading, setProofreadLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateTags = async () => {
    if (!content || content.trim().length < 20) {
      setError('文章内容太短，无法生成标签');
      return;
    }

    try {
      setTagsLoading(true);
      setError('');
      const res = await generateTags(title, content);
      if (res.code === 200 && res.data?.tags) {
        onTagsGenerated?.(res.data.tags);
      } else {
        setError(res.msg || '标签生成失败');
      }
    } catch (err) {
      setError(err.msg || 'AI 服务暂时不可用');
    } finally {
      setTagsLoading(false);
    }
  };

  const handleProofread = async () => {
    if (!content || content.trim().length < 10) {
      setError('内容太短，无需纠错');
      return;
    }

    try {
      setProofreadLoading(true);
      setError('');
      const res = await proofreadContent(content);
      if (res.code === 200 && res.data?.corrected) {
        onContentCorrected?.(res.data.corrected);
      } else {
        setError(res.msg || '纠错失败');
      }
    } catch (err) {
      setError(err.msg || 'AI 服务暂时不可用');
    } finally {
      setProofreadLoading(false);
    }
  };

  const isLoading = tagsLoading || proofreadLoading;

  return (
    <div className="ai-toolbar">
      <div className="ai-toolbar-buttons">
        {showTagsButton && (
          <button
            type="button"
            className="btn btn-ai"
            onClick={handleGenerateTags}
            disabled={isLoading}
            title="AI 根据文章内容自动生成标签"
          >
            <svg className="ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            {tagsLoading ? '生成中...' : 'AI 生成标签'}
          </button>
        )}
        
        {showProofreadButton && (
          <button
            type="button"
            className="btn btn-ai"
            onClick={handleProofread}
            disabled={isLoading}
            title="AI 检查并修正错别字和语法问题"
          >
            <svg className="ai-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {proofreadLoading ? '纠错中...' : 'AI 纠错'}
          </button>
        )}
      </div>
      
      {error && (
        <div className="ai-toolbar-error">{error}</div>
      )}
    </div>
  );
}

export default AIToolbar;
