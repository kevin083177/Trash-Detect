import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../styles/Layout.css';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { logout } = useAuth();
  return (
    <div className="left-layout">
      <aside>
        <div className="logo-row">
          <div className="circle">
            <img src="/logo.png" alt="Logo" />
          </div>
          <div className="title">Garbi</div>
        </div>
        <nav className="main-button">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>統計資料</button>
          </NavLink>
          <NavLink to="/feedback" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>訊息回饋</button>
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>使用者資訊</button>
          </NavLink>
          <NavLink to="/theme" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>商品區域</button>
          </NavLink>
          <NavLink to="/game" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>遊戲區域</button>
          </NavLink>

        </nav>
        <div className="logout-button">
          <NavLink
            to="#"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <button onClick={logout}>登出</button>
          </NavLink>
        </div>
      </aside>

      <main className="right-layout">      
        <div className="right-content">  
          <Outlet />
          </div>
      </main>
    </div>
  );
};
