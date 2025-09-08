import React, { useState } from 'react';
import './styles/Header.css';
import { useAuth } from '../context/AuthContext';
import { TiArrowSortedDown } from "react-icons/ti";
import { IoPersonSharp } from "react-icons/io5";
import { MdOutlineLogout } from "react-icons/md";

export const Header: React.FC<{className?: string}> = ({ className = "" }) => {
  const { username } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const { logout } = useAuth();

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
  };
  
  const handleLogoutClick = () => {
    logout();
    setIsDropdownOpen(false);
  };
  
  return (
    <div className={`page-header ${className}`}>
      <div 
        className="user-menu"
        onMouseEnter={() => setIsDropdownOpen(true)}
        onMouseLeave={() => setIsDropdownOpen(false)}
      >
        <span className="user-greeting">Hi, {username} </span>
        <TiArrowSortedDown style={{alignSelf: 'center', paddingTop: 4, cursor: 'pointer'}} size={20}/>
        

        {isDropdownOpen && (
          <div className="dropdown-menu">
            <button 
              className="dropdown-item"
              onClick={handleProfileClick}
            >
              <IoPersonSharp />
              個人資料
            </button>
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