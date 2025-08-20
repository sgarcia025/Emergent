import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Download, Users, CreditCard, TrendingUp, DollarSign } from 'lucide-react';
import axios from 'axios';
import { AuthContext, API } from '../App';
import Sidebar from './Sidebar';

function TicketSales() {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [ticketFormData, setTicketFormData] = useState({
    name: '',
    type: 'general',
    price: 0,
    stock: 100,
    max_per_person: 10,
    description: ''
  });

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

  const handleCreateTicketType = async (e) => {
    e.preventDefault();
    try {
      const updatedEvent = {
        ...event,
        ticket_types: [
          ...event.ticket_types,
          {
            id: `ticket_${Date.now()}`,
            ...ticketFormData,
            price: parseFloat(ticketFormData.price),
            stock: parseInt(ticketFormData.stock),
            max_per_person: parseInt(ticketFormData.max_per_person),
            is_active: true
          }
        ]
      };

      await axios.put(`${API}/events/${eventId}`, {
        name: event.name,
        description: event.description,
        date: event.date,
        venue: event.venue,
        category_tags: event.category_tags
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setEvent(updatedEvent);
      setShowTicketForm(false);
      setTicketFormData({
        name: '',
        type: 'general',
        price: 0,
        stock: 100,
        max_per_person: 10,
        description: ''
      });
    } catch (error) {
      console.error('Error creating ticket type:', error);
    }
  };

  const exportAttendees = () => {
    if (attendees.length === 0) return;

    const csvContent = [
      ['Nombre', 'Email', 'Teléfono', 'Tipo de Ticket', 'Fecha de Compra', 'Check-in', 'Hora de Check-in'],
      ...attendees.map(attendee => [
        attendee.name,
        attendee.email,
        attendee.phone,
        attendee.ticket_type,
        attendee.purchase_date,
        attendee.checked_in,
        attendee.check_in_time
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${event?.name}_attendees.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">
            <div className="spinner"></div>
            Cargando datos de tickets...
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
            <h1 className="page-title">Gestión de Tickets</h1>
            <p className="page-subtitle">
              {event?.name} - Configura tipos de tickets y monitorea ventas
            </p>
          </div>
          <Link to="/events" className="btn btn-secondary">
            ← Volver a Eventos
          </Link>
        </div>

        {/* Sales Statistics */}
        {analytics && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analytics.total_tickets_sold}</div>
              <div className="stat-label">Tickets Vendidos</div>
              <div className="stat-change positive">
                <TrendingUp size={14} />
                {analytics.check_in_rate.toFixed(1)}% check-in rate
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
                Han hecho check-in
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.keys(analytics.ticket_type_breakdown).length}</div>
              <div className="stat-label">Tipos de Tickets</div>
              <div className="stat-change positive">
                <CreditCard size={14} />
                Configurados
              </div>
            </div>
          </div>
        )}

        {/* Ticket Types Configuration */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Tipos de Tickets</h2>
            <button 
              onClick={() => setShowTicketForm(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Nuevo Tipo
            </button>
          </div>

          {showTicketForm && (
            <div className="fade-in" style={{ marginBottom: '24px', padding: '24px', background: 'var(--gray-50)', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px' }}>
                {editingTicket ? 'Editar Tipo de Ticket' : 'Crear Nuevo Tipo de Ticket'}
              </h3>
              
              <form onSubmit={handleCreateTicketType}>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre del Ticket</label>
                    <input
                      type="text"
                      className="form-input"
                      value={ticketFormData.name}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, name: e.target.value })}
                      required
                      placeholder="Ej: Entrada General"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select
                      className="form-input form-select"
                      value={ticketFormData.type}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, type: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="vip">VIP</option>
                      <option value="early_bird">Early Bird</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">Precio ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={ticketFormData.price}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Stock Disponible</label>
                    <input
                      type="number"
                      className="form-input"
                      value={ticketFormData.stock}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, stock: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Máximo por Persona</label>
                    <input
                      type="number"
                      className="form-input"
                      value={ticketFormData.max_per_person}
                      onChange={(e) => setTicketFormData({ ...ticketFormData, max_per_person: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción (opcional)</label>
                  <textarea
                    className="form-input form-textarea"
                    value={ticketFormData.description}
                    onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
                    placeholder="Describe los beneficios de este tipo de ticket..."
                    rows="3"
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary">
                    <Plus size={16} />
                    {editingTicket ? 'Actualizar' : 'Crear'} Tipo de Ticket
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowTicketForm(false);
                      setEditingTicket(null);
                      setTicketFormData({
                        name: '',
                        type: 'general',
                        price: 0,
                        stock: 100,
                        max_per_person: 10,
                        description: ''
                      });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {event?.ticket_types?.length > 0 ? (
            <div className="grid">
              {event.ticket_types.map((ticketType) => {
                const typeStats = analytics?.ticket_type_breakdown?.[ticketType.id] || { sold: 0, revenue: 0, checked_in: 0 };
                
                return (
                  <div key={ticketType.id} className="card slide-up">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                          {ticketType.name}
                        </h3>
                        <span className={`badge badge-${ticketType.type === 'vip' ? 'warning' : ticketType.type === 'early_bird' ? 'success' : 'info'}`}>
                          {ticketType.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--whatsapp-green)' }}>
                        ${ticketType.price}
                      </div>
                    </div>

                    {ticketType.description && (
                      <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
                        {ticketType.description}
                      </p>
                    )}

                    <div className="grid grid-3" style={{ marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--blue)' }}>
                          {typeStats.sold}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Vendidos</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--success)' }}>
                          ${typeStats.revenue.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Ingresos</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--warning)' }}>
                          {ticketType.stock - typeStats.sold}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>Disponibles</div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--gray-200)'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                        Máx. por persona: {ticketType.max_per_person} | Stock total: {ticketType.stock}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm">
                          <Edit size={14} />
                          Editar
                        </button>
                        <Link 
                          to={`/event/${eventId}`} 
                          target="_blank"
                          className="btn btn-primary btn-sm"
                        >
                          <Eye size={14} />
                          Ver Público
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-500)' }}>
              <CreditCard size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
              <h3 style={{ marginBottom: '8px' }}>No hay tipos de tickets</h3>
              <p style={{ marginBottom: '24px' }}>Crea diferentes tipos de tickets para tu evento</p>
              <button 
                onClick={() => setShowTicketForm(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Crear Primer Tipo de Ticket
              </button>
            </div>
          )}
        </div>

        {/* Attendees List */}
        {attendees.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Lista de Asistentes ({attendees.length})</h2>
              <button 
                onClick={exportAttendees}
                className="btn btn-secondary"
              >
                <Download size={16} />
                Exportar CSV
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Tipo de Ticket</th>
                    <th>Fecha de Compra</th>
                    <th>Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.slice(0, 10).map((attendee, index) => (
                    <tr key={index}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{attendee.name}</div>
                        {attendee.phone && (
                          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                            {attendee.phone}
                          </div>
                        )}
                      </td>
                      <td>{attendee.email}</td>
                      <td>
                        <span className="badge badge-info">
                          {attendee.ticket_type}
                        </span>
                      </td>
                      <td>{new Date(attendee.purchase_date).toLocaleDateString('es-ES')}</td>
                      <td>
                        <span className={`badge ${attendee.checked_in === 'Yes' ? 'badge-success' : 'badge-warning'}`}>
                          {attendee.checked_in === 'Yes' ? 'Sí' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {attendees.length > 10 && (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <p style={{ color: 'var(--gray-600)' }}>
                  Mostrando 10 de {attendees.length} asistentes. 
                  <button 
                    onClick={exportAttendees}
                    style={{ marginLeft: '8px', color: 'var(--whatsapp-green)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Exportar todos en CSV
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketSales;