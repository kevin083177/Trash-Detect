import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './styles/Layout.css';
import { 
  FaChartBar, 
  FaComments, 
  FaUsers, 
  FaStore, 
  FaGamepad
} from 'react-icons/fa';
import { IoReorderThreeOutline } from "react-icons/io5";
import { IoTicket } from "react-icons/io5";

export const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="left-layout">
      <aside className={isCollapsed ? 'collapsed' : ''}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className='logo-row'>
              <div className="circle">
                <img src="/logo.png" alt="Logo" />
              </div>
              <div className="title">Garbi</div>
            </div>
            <button className="toggle-button" onClick={toggleSidebar}>
              <IoReorderThreeOutline size={50} />
            </button>
          </div>
        </div>

        <nav className="main-button">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <button title="儀表板">
              <FaChartBar className="button-icon" />
              <span className="button-text">儀表板</span>
            </button>
          </NavLink>
          <NavLink to="/feedback" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button title="訊息管理">
              <FaComments className="button-icon" />
              <span className="button-text">訊息管理</span>
            </button>
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button title="使用者管理">
              <FaUsers className="button-icon" />
              <span className="button-text">使用者管理</span>
            </button>
          </NavLink>
          <NavLink to="/theme" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button title="商品管理">
              <FaStore className="button-icon" />
              <span className="button-text">商品管理</span>
            </button>
          </NavLink>
          <NavLink to="/voucher" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button title="票券管理">
              <IoTicket className="button-icon" />
              <span className="button-text">票券管理</span>
            </button>
          </NavLink>
          <NavLink to="/game" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button title="遊戲管理">
              <FaGamepad className="button-icon" />
              <span className="button-text">遊戲管理</span>
            </button>
          </NavLink>
        </nav>
      </aside>

      <main className={`right-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>      
        <div className="right-content">  
          <Outlet />
        </div>
      </main>
    </div>
  );
};