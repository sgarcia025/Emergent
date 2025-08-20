import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, CreditCard, DollarSign, Download, Calendar, Clock, MapPin } from 'lucide-react';
import axios from 'axios';
import { AuthContext, API } from '../App';
import Sidebar from './Sidebar';

function Analytics() {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchEventData();
    fetchAnalytics();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const analyticsResponse = await axios.get(`${API}/events/${eventId}/analytics`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAnalytics(analyticsResponse.data);

      const attendeesResponse = await axios.get(`${API}/events/${eventId}/attendees/export`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAttendees(attendeesResponse.data.attendees || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!analytics || !event) return;

    const reportData = {
      event: {
        name: event.name,
        date: event.date,
        venue: event.venue
      },
      summary: {
        total_tickets_sold: analytics.total_tickets_sold,
        total_revenue: analytics.total_revenue,
        checked_in_count: analytics.checked_in_count,
        check_in_rate: analytics.check_in_rate
      },
      ticket_breakdown: analytics.ticket_type_breakdown,
      attendees: attendees
    };

    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.name}_analytics_report.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mockChartData = {
    salesOverTime: [
      { period: 'Semana 1', sales: 450 },
      { period: 'Semana 2', sales: 680 },
      { period: 'Semana 3', sales: 890 },
      { period: 'Semana 4', sales: 1230 }
    ],
    checkInByHour: [
      { hour: '17:00', count: 12 },
      { hour: '18:00', count: 28 },
      { hour: '19:00', count: 45 },
      { hour: '20:00', count: 32 },
      { hour: '21:00', count: 18 }
    ]
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">
            <div className="spinner"></div>
            Cargando analytics...
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
          <div>
            <h1 className="page-title">Analytics & Reportes</h1>
            <p className="page-subtitle">
              {event?.name} - Análisis detallado de rendimiento del evento
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={exportReport} className="btn btn-secondary">
              <Download size={16} />
              Exportar Reporte
            </button>
            <Link to="/events" className="btn btn-secondary">
              ← Volver a Eventos
            </Link>
          </div>
        </div>

        {/* Event Overview */}
        {event && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Información del Evento</h2>
            </div>
            
            <div className="grid grid-3">
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-600)' }}>
                <Calendar size={20} style={{ marginRight: '12px', color: 'var(--whatsapp-green)' }} />
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Fecha</div>
                  <div style={{ fontSize: '16px' }}>
                    {new Date(event.date).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-600)' }}>
                <Clock size={20} style={{ marginRight: '12px', color: 'var(--whatsapp-green)' }} />
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Hora</div>
                  <div style={{ fontSize: '16px' }}>
                    {new Date(event.date).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-600)' }}>
                <MapPin size={20} style={{ marginRight: '12px', color: 'var(--whatsapp-green)' }} />
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>Ubicación</div>
                  <div style={{ fontSize: '16px' }}>{event.venue}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        {analytics && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analytics.total_tickets_sold}</div>
              <div className="stat-label">Tickets Vendidos</div>
              <div className="stat-change positive">
                <TrendingUp size={14} />
                {analytics.check_in_rate.toFixed(1)}% tasa de asistencia
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">${analytics.total_revenue.toFixed(2)}</div>
              <div className="stat-label">Ingresos Totales</div>
              <div className="stat-change positive">
                <DollarSign size={14} />
                Revenue generado
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analytics.checked_in_count}</div>
              <div className="stat-label">Asistentes Confirmados</div>
              <div className="stat-change positive">
                <Users size={14} />
                Check-ins realizados
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                ${analytics.total_tickets_sold > 0 ? (analytics.total_revenue / analytics.total_tickets_sold).toFixed(2) : '0.00'}
              </div>
              <div className="stat-label">Precio Promedio</div>
              <div className="stat-change positive">
                <CreditCard size={14} />
                Por ticket
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-2">
          {/* Ticket Type Breakdown */}
          {analytics && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Desglose por Tipo de Ticket</h2>
              </div>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {Object.entries(analytics.ticket_type_breakdown).map(([ticketTypeId, stats]) => {
                  const ticketType = event?.ticket_types?.find(tt => tt.id === ticketTypeId);
                  const percentage = analytics.total_tickets_sold > 0 
                    ? (stats.sold / analytics.total_tickets_sold * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <div key={ticketTypeId} className="slide-up" style={{ 
                      padding: '16px', 
                      border: '1px solid var(--gray-200)', 
                      borderRadius: '12px', 
                      marginBottom: '12px',
                      background: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                          {ticketType?.name || ticketTypeId}
                        </h3>
                        <span className="badge badge-info">
                          {percentage}% del total
                        </span>
                      </div>
                      
                      <div className="grid grid-3" style={{ gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--blue)' }}>
                            {stats.sold}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Vendidos</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--success)' }}>
                            ${stats.revenue.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Ingresos</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--warning)' }}>
                            {stats.checked_in}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Check-ins</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ 
                          background: 'var(--gray-200)', 
                          height: '6px', 
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            background: 'var(--whatsapp-green)', 
                            height: '100%', 
                            width: `${percentage}%`,
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sales Timeline */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Ventas en el Tiempo</h2>
              <select 
                className="form-select"
                style={{ width: 'auto' }}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="all">Todo el período</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                  Progresión de Ventas
                </h3>
                {mockChartData.salesOverTime.map((data, index) => (
                  <div key={index} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{data.period}</span>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>${data.sales}</span>
                    </div>
                    <div style={{ 
                      background: 'var(--gray-200)', 
                      height: '8px', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        background: 'linear-gradient(90deg, var(--whatsapp-green), var(--whatsapp-green-dark))', 
                        height: '100%', 
                        width: `${(data.sales / 1230) * 100}%`,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                  Check-ins por Hora
                </h3>
                {mockChartData.checkInByHour.map((data, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{data.hour}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          background: 'var(--blue)', 
                          height: '4px', 
                          width: `${(data.count / 45) * 60}px`,
                          borderRadius: '2px'
                        }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', minWidth: '20px' }}>
                          {data.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Resumen Financiero</h2>
          </div>

          <div className="grid grid-2">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Desglose de Ingresos
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Ingresos Brutos</span>
                  <span style={{ fontWeight: '600' }}>${analytics?.total_revenue.toFixed(2) || '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--gray-600)' }}>
                  <span>Comisiones (5%)</span>
                  <span>-${((analytics?.total_revenue || 0) * 0.05).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--gray-600)' }}>
                  <span>Procesamiento (2.9%)</span>
                  <span>-${((analytics?.total_revenue || 0) * 0.029).toFixed(2)}</span>
                </div>
                <hr style={{ margin: '16px 0', border: '1px solid var(--gray-200)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: 'var(--success)' }}>
                  <span>Ingresos Netos</span>
                  <span>${((analytics?.total_revenue || 0) * 0.921).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Métricas de Rendimiento
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--blue)' }}>
                    {analytics?.check_in_rate.toFixed(1) || 0}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Tasa de Asistencia</div>
                </div>
                
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--success)' }}>
                    ${analytics && analytics.total_tickets_sold > 0 ? (analytics.total_revenue / analytics.total_tickets_sold).toFixed(2) : '0.00'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Precio Promedio por Ticket</div>
                </div>
                
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--warning)' }}>
                    {event?.ticket_types?.reduce((total, tt) => total + tt.stock, 0) - (analytics?.total_tickets_sold || 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Tickets Restantes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recomendaciones e Insights</h2>
          </div>

          <div className="grid grid-3">
            <div className="alert alert-success">
              <strong>🏆 Excelente Rendimiento</strong>
              <p style={{ marginTop: '8px', marginBottom: '0', fontSize: '14px' }}>
                Tu tasa de asistencia del {analytics?.check_in_rate.toFixed(1) || 0}% está por encima del promedio de la industria (75%).
              </p>
            </div>

            <div className="alert alert-info">
              <strong>💡 Oportunidad de Mejora</strong>
              <p style={{ marginTop: '8px', marginBottom: '0', fontSize: '14px' }}>
                Considera enviar recordatorios automáticos 24h antes del evento para maximizar la asistencia.
              </p>
            </div>

            <div className="alert alert-warning">
              <strong>📊 Análisis de Precios</strong>
              <p style={{ marginTop: '8px', marginBottom: '0', fontSize: '14px' }}>
                El precio promedio por ticket sugiere buena aceptación. Considera precios dinámicos para futuros eventos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;