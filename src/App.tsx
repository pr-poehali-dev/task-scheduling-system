import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Workers from './pages/Workers';
import Objects from './pages/Objects';
import Archive from './pages/Archive';
import Statistics from './pages/Statistics';
import Admin from './pages/Admin';
import Import from './pages/Import';
import Login from './pages/Login';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [authUser, setAuthUser] = useState<string>(() => localStorage.getItem('auth_user') || '');
  const [authRole, setAuthRole] = useState<string>(() => localStorage.getItem('auth_role') || '');

  useEffect(() => {
    // Проверяем токен при загрузке
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('https://functions.poehali.dev/657f0b95-ba26-4bf1-8a1b-481465de6d69', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ _path: '/me' }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.ok) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_role');
            setAuthToken(null);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogin = (token: string, username: string, role: string) => {
    setAuthToken(token);
    setAuthUser(username);
    setAuthRole(role);
  };

  const handleLogout = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('https://functions.poehali.dev/657f0b95-ba26-4bf1-8a1b-481465de6d69', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({ _path: '/logout' }),
      }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    setAuthToken(null);
    setAuthUser('');
    setAuthRole('');
  };

  if (!authToken) {
    return (
      <TooltipProvider>
        <Login onLogin={handleLogin} />
      </TooltipProvider>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'orders': return <Orders />;
      case 'workers': return <Workers />;
      case 'objects': return <Objects />;
      case 'archive': return <Archive />;
      case 'statistics': return <Statistics />;
      case 'admin': return <Admin />;
      case 'import': return <Import />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        authUser={authUser}
        authRole={authRole}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
    </TooltipProvider>
  );
}