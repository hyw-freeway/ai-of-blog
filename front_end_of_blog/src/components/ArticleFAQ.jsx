import { useState, useEffect } from 'react';
import Accordion from './Accordion';
import { getArticleFAQ } from '../services/api';
import './ArticleFAQ.css';

function ArticleFAQ({ articleId }) {
  const [faq, setFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!articleId) return;

    const fetchFAQ = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getArticleFAQ(articleId);
        if (res.code === 200 && res.data?.faq) {
          setFaq(res.data.faq);
        } else {
          setFaq(null);
        }
      } catch (err) {
        console.error('获取FAQ失败:', err);
        setError('无法加载常见问题');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQ();
  }, [articleId]);

  if (loading) {
    return (
      <div className="article-faq">
        <div className="article-faq-header">
          <h3 className="article-faq-title">常见问题</h3>
          <span className="article-faq-badge">AI 生成</span>
        </div>
        <div className="article-faq-loading">
          <div className="faq-loading-spinner"></div>
          <span>正在生成常见问题...</span>
        </div>
      </div>
    );
  }

  if (error || !faq || faq.length === 0) {
    return null;
  }

  return (
    <div className="article-faq">
      <div className="article-faq-header">
        <h3 className="article-faq-title">常见问题</h3>
        <span className="article-faq-badge">AI 生成</span>
      </div>
      <Accordion items={faq} />
    </div>
  );
}

export default ArticleFAQ;
