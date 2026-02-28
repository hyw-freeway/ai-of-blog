/**
 * 返回顶部按钮组件
 * 滚动超过300px后显示，点击平滑滚动到顶部
 */
import { useState, useEffect } from 'react';
import './BackToTop.css';

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!visible) return null;

  return (
    <button
      className="back-to-top"
      onClick={scrollToTop}
      aria-label="返回顶部"
      title="返回顶部"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  );
}

export default BackToTop;
