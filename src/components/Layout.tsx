import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './styles/Layout.css';
import { useAuth } from '../context/AuthContext';
import { 
  FaChartBar, 
  FaComments, 
  FaUsers, 
  FaStore, 
  FaGamepad, 
  FaSignOutAlt 
} from 'react-icons/fa';

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
            <button>
              <FaChartBar className="button-icon" />
              儀表板
            </button>
          </NavLink>
          <NavLink to="/feedback" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>
              <FaComments className="button-icon" />
              訊息回饋
            </button>
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>
              <FaUsers className="button-icon" />
              使用者資訊
            </button>
          </NavLink>
          <NavLink to="/theme" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>
              <FaStore className="button-icon" />
              商品區域
            </button>
          </NavLink>
          <NavLink to="/game" className={({ isActive }) => (isActive ? 'active' : '')}>
            <button>
              <FaGamepad className="button-icon" />
              遊戲區域
            </button>
          </NavLink>

        </nav>
        <div className="logout-button">
          <NavLink
            to="#"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <button onClick={logout}>
              <FaSignOutAlt className="button-icon" />
              登出
            </button>
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