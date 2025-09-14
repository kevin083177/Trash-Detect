import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import './styles/Layout.css';

export const Layout: React.FC = () => {
  return (
    <div className="_layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};