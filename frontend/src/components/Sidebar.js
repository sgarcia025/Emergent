import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  QrCode, 
  Bot, 
  Store, 
  BarChart3,
  Settings,
  User
} from 'lucide-react';
import { AuthContext } from '../App';

function Sidebar() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Eventos',
      href: '/events',
      icon: Calendar
    },
    {
      name: 'Tickets',
      href: '/tickets',
      icon: CreditCard
    },
    {
      name: 'Check-in',
      href: '/checkin',
      icon: QrCode
    },
    {
      name: 'Bot WhatsApp',
      href: '/bot',
      icon: Bot
    },
    {
      name: 'NewPay',
      href: '/newpay',
      icon: Store
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: Settings
    }
  ];

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">WhatsNew</div>
        <div className="sidebar-subtitle">Admin Panel</div>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <Icon className="nav-item-icon" size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ 
        position: 'absolute', 
        bottom: '24px', 
        left: '24px', 
        right: '24px',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: 'rgba(255, 255, 255, 0.9)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <User size={16} style={{ marginRight: '8px' }} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.name}</span>
        </div>
        <div style={{ fontSize: '12px', opacity: '0.8' }}>{user.email}</div>
      </div>
    </div>
  );
}

export default Sidebar;