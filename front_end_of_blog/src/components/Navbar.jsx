/**
 * 导航栏组件
 * 响应式设计，手机端显示汉堡菜单
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isLoggedIn, getUsername, clearAuth } from '../utils/auth';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const username = getUsername();

  const handleLogout = () => {
    clearAuth();
    setMenuOpen(false);
    navigate('/');
    window.location.reload();
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          个人博客
        </Link>

        <button 
          className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="菜单"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="navbar-link" onClick={closeMenu}>
            首页
          </Link>
          
          {loggedIn ? (
            <>
              <Link to="/upload" className="navbar-link" onClick={closeMenu}>
                发布文章
              </Link>
              <div className="navbar-user">
                <span className="navbar-username">{username}</span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  退出
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="navbar-link" onClick={closeMenu}>
              管理员登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
