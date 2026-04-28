/**
 * 滚动导航组件
 * 提供"一键回顶部"和"一键到底部"两个按钮：
 *   - 滚动距离 > 200px 时显示
 *   - 已在顶部附近：仅显示「到底部」
 *   - 已在底部附近：仅显示「回顶部」
 *   - 在中间：两个按钮都显示
 */
import { useState, useEffect } from 'react';
import './BackToTop.css';

const SHOW_THRESHOLD = 200;
const EDGE_THRESHOLD = 100;

function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      setVisible(scrollY > SHOW_THRESHOLD || docHeight - viewportHeight - scrollY > SHOW_THRESHOLD);
      setAtTop(scrollY <= EDGE_THRESHOLD);
      setAtBottom(docHeight - viewportHeight - scrollY <= EDGE_THRESHOLD);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <div className="scroll-nav" role="group" aria-label="页面滚动导航">
      {!atTop && (
        <button
          className="scroll-nav-btn"
          onClick={scrollToTop}
          aria-label="返回顶部"
          title="返回顶部"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
      {!atBottom && (
        <button
          className="scroll-nav-btn"
          onClick={scrollToBottom}
          aria-label="跳到底部"
          title="跳到底部"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default BackToTop;
