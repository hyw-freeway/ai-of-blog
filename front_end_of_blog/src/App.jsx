/**
 * 应用根组件
 * 配置路由和全局布局
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BackToTop from './components/BackToTop';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Edit from './pages/Edit';
import './styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/edit/:id" element={<Edit />} />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} 个人博客. All rights reserved.</p>
          </div>
        </footer>
        <BackToTop />
      </div>
    </BrowserRouter>
  );
}

export default App;
