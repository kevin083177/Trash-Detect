import React from 'react';
import './styles/Header.css';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = "" }) => {
  const { username } = useAuth();
  
  return (
    <div className={`page-header ${className}`}>
      <span>Hi, { username }</span>
    </div>
  );
};