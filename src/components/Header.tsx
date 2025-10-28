import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/Header.css';
import { useAuth } from '../context/AuthContext';
import { MdOutlineLogout } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa6";

const routes = [
  { path: '/', name: '首頁' },
  { path: '/maps', name: '站點管理'},
  { path: '/feedback', name: '訊息管理' },
  { path: '/users', name: '使用者管理' },
  { path: '/theme', name: '商品管理' },
  { path: '/voucher', name: '票券管理' },
  { 
    path: '/game', 
    name: '遊戲管理',
    children: [
      { path: '/game', name: '題目管理' },
      { path: '/levels', name: '關卡管理' }
    ]
  },
];

export const Header: React.FC<{className?: string}> = ({ className = "" }) => {
  const { username } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveNavDropdown(null);
      setIsDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleUserMenuClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
    setActiveNavDropdown(null);
  };

  const handleLogoutClick = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const handleNavClick = (path: string, hasChildren: boolean = false, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (hasChildren) {
      setActiveNavDropdown(activeNavDropdown === path ? null : path);
      setIsDropdownOpen(false);
    } else {
      navigate(path);
      setActiveNavDropdown(null);
      setIsDropdownOpen(false);
    }
  };

  const handleSubNavClick = (path: string) => {
    navigate(path);
    setActiveNavDropdown(null);
    setIsDropdownOpen(false);
  };

  const handleLogoClick = () => {
    navigate('/');
    setActiveNavDropdown(null);
    setIsDropdownOpen(false);
  };

  const isCurrentRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isParentRouteActive = (route: any) => {
    if (route.children) {
      return route.children.some((child: any) => isCurrentRoute(child.path));
    }
    return isCurrentRoute(route.path);
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
              <div className="nav-item-container">
                <button
                  className={`nav-item ${isParentRouteActive(route) ? 'active' : ''} ${route.children ? 'has-children' : ''}`}
                  onClick={(e) => handleNavClick(route.path, !!route.children, e)}
                >
                  {route.name}
                  {route.children && (
                    <FaChevronDown 
                      className={`nav-chevron ${activeNavDropdown === route.path ? 'open' : ''}`}
                      size={14}
                    />
                  )}
                </button>
                
                {route.children && activeNavDropdown === route.path && (
                  <div className="nav-dropdown">
                    {route.children.map((child: any) => (
                      <button
                        key={child.path}
                        className={`nav-dropdown-item ${isCurrentRoute(child.path) ? 'active' : ''}`}
                        onClick={() => handleSubNavClick(child.path)}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {index < routes.length - 1 && (
                <span className="nav-separator">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div 
        className="user-menu"
        onClick={handleUserMenuClick}
      >
        <span className="user-greeting">Hi, {username} </span>
        <FaChevronDown 
          className={`user-chevron ${isDropdownOpen ? 'open' : ''}`}
          style={{alignSelf: 'center', paddingTop: 4, cursor: 'pointer'}} 
          size={20} 
          color='#fff'
        />
        
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