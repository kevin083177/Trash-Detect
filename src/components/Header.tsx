import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/Header.css';
import { useAuth } from '../context/AuthContext';
import { IoPersonSharp } from "react-icons/io5";
import { MdOutlineLogout } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";

const routes = [
  { path: '/', name: '首頁' },
  { path: '/feedback', name: '訊息管理' },
  { path: '/users', name: '使用者管理' },
  { path: '/theme', name: '商品管理' },
  { path: '/voucher', name: '票券管理' },
  { path: '/game', name: '遊戲管理' }
];

export const Header: React.FC<{className?: string}> = ({ className = "" }) => {
  const { username } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { logout } = useAuth();

  // 監聽滾動事件
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    // 初始化檢查
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
  };
  
  const handleLogoutClick = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const isCurrentRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className={`page-header ${className} ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-left">
        <div className="logo-container" onClick={handleLogoClick}>
          <span className="logo-text">Garbi</span>
        </div>
        
        <nav className="header-nav">
          {routes.map((route, index) => (
            <React.Fragment key={route.path}>
              <button
                className={`nav-item ${isCurrentRoute(route.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(route.path)}
              >
                {route.name}
              </button>
              {index < routes.length - 1 && (
                <span className="nav-separator">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div 
        className="user-menu"
        onMouseEnter={() => setIsDropdownOpen(true)}
        onMouseLeave={() => setIsDropdownOpen(false)}
      >
        <span className="user-greeting">Hi, {username} </span>
        <FaChevronDown style={{alignSelf: 'center', paddingTop: 4, cursor: 'pointer'}} size={20} color='#fff'/>
        
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <button 
              className="dropdown-item"
              onClick={handleLogoutClick}
              style={{color: 'red'}}
            >
              <MdOutlineLogout />
              登出
            </button>
          </div>
        )}
      </div>
    </div>
  );
};