import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, CreditCard, Bot, BarChart3, Settings, Plus, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { AuthContext, API } from '../App';
import Sidebar from './Sidebar';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalTickets: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const eventsResponse = await axios.get(`${API}/events`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      const eventsData = eventsResponse.data;
      setEvents(eventsData);
      
      // Calculate stats
      const now = new Date();
      const activeEvents = eventsData.filter(event => new Date(event.date) > now);
      
      setStats({
        totalEvents: eventsData.length,
        activeEvents: activeEvents.length,
        totalTickets: 0, // Will be calculated from analytics
        totalRevenue: 0
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Crear Evento',
      description: 'Nuevo evento con tickets',
      icon: Plus,
      color: 'var(--whatsapp-green)',
      link: '/events?action=create'
    },
    {
      title: 'Ver Check-ins',
      description: 'Validar códigos QR',
      icon: Users,
      color: 'var(--blue)',
      link: events.length > 0 ? `/events/${events[0].id}/checkin` : '/events'
    },
    {
      title: 'Configurar Bot',
      description: 'Asistente WhatsApp',
      icon: Bot,
      color: 'var(--success)',
      link: events.length > 0 ? `/events/${events[0].id}/bot` : '/events'
    },
    {
      title: 'Ver Reportes',
      description: 'Análisis y métricas',
      icon: BarChart3,
      color: 'var(--warning)',
      link: events.length > 0 ? `/events/${events[0].id}/analytics` : '/events'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">
            <div className="spinner"></div>
            Cargando dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Bienvenido a WhatsNew Admin - Gestiona tus eventos de manera profesional
          </p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalEvents}</div>
            <div className="stat-label">Eventos Totales</div>
            <div className="stat-change positive">
              <TrendingUp size={14} /> +12% este mes
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activeEvents}</div>
            <div className="stat-label">Eventos Activos</div>
            <div className="stat-change positive">
              <TrendingUp size={14} /> Próximos eventos
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalTickets}</div>
            <div className="stat-label">Tickets Vendidos</div>
            <div className="stat-change positive">
              <TrendingUp size={14} /> +25% esta semana
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
            <div className="stat-label">Ingresos Totales</div>
            <div className="stat-change positive">
              <TrendingUp size={14} /> +18% este mes
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Acciones Rápidas</h2>
            <p className="card-subtitle">Gestiona tus eventos eficientemente</p>
          </div>
          <div className="grid grid-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link 
                  key={index}
                  to={action.link}
                  className="card"
                  style={{ 
                    textDecoration: 'none',
                    borderLeft: `4px solid ${action.color}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <Icon 
                      size={24} 
                      style={{ color: action.color, marginRight: '12px' }}
                    />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {action.title}
                    </h3>
                  </div>
                  <p style={{ color: 'var(--gray-600)', fontSize: '14px' }}>
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Events */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Eventos Recientes</h2>
            <Link to="/events" className="btn btn-primary btn-sm">
              <Plus size={16} />
              Nuevo Evento
            </Link>
          </div>
          {events.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre del Evento</th>
                    <th>Fecha</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 5).map((event) => {
                    const eventDate = new Date(event.date);
                    const isUpcoming = eventDate > new Date();
                    
                    return (
                      <tr key={event.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{event.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                            {event.category_tags.join(', ')}
                          </div>
                        </td>
                        <td>{eventDate.toLocaleDateString('es-ES')}</td>
                        <td>{event.venue}</td>
                        <td>
                          <span className={`badge ${isUpcoming ? 'badge-success' : 'badge-info'}`}>
                            {isUpcoming ? 'Próximo' : 'Finalizado'}
                          </span>
                        </td>
                        <td>
                          <Link 
                            to={`/events/${event.id}/tickets`}
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '8px' }}
                          >
                            <CreditCard size={14} />
                            Tickets
                          </Link>
                          <Link 
                            to={`/events/${event.id}/analytics`}
                            className="btn btn-secondary btn-sm"
                          >
                            <BarChart3 size={14} />
                            Analytics
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-500)' }}>
              <Calendar size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
              <h3 style={{ marginBottom: '8px' }}>No hay eventos creados</h3>
              <p style={{ marginBottom: '24px' }}>Comienza creando tu primer evento</p>
              <Link to="/events?action=create" className="btn btn-primary">
                <Plus size={16} />
                Crear Primer Evento
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;