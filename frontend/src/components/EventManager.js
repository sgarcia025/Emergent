import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, Tag, Edit, Copy, Trash2, Users, CreditCard, Bot, Store, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { AuthContext, API } from '../App';
import Sidebar from './Sidebar';

function EventManager() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    venue: '',
    category_tags: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        category_tags: formData.category_tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await axios.post(`${API}/events`, eventData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setEvents([response.data, ...events]);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', date: '', venue: '', category_tags: '' });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        category_tags: formData.category_tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await axios.put(`${API}/events/${editingEvent.id}`, eventData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setEvents(events.map(event => 
        event.id === editingEvent.id ? response.data : event
      ));
      setEditingEvent(null);
      setFormData({ name: '', description: '', date: '', venue: '', category_tags: '' });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16),
      venue: event.venue,
      category_tags: event.category_tags.join(', ')
    });
    setShowCreateForm(true);
  };

  const handleDuplicateEvent = async (event) => {
    try {
      const duplicateData = {
        name: `${event.name} (Copia)`,
        description: event.description,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        venue: event.venue,
        category_tags: event.category_tags
      };

      const response = await axios.post(`${API}/events`, duplicateData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setEvents([response.data, ...events]);
    } catch (error) {
      console.error('Error duplicating event:', error);
    }
  };

  const eventActions = (event) => [
    {
      label: 'Tickets',
      icon: CreditCard,
      color: 'var(--whatsapp-green)',
      link: `/events/${event.id}/tickets`
    },
    {
      label: 'Check-in',
      icon: Users,
      color: 'var(--blue)',
      link: `/events/${event.id}/checkin`
    },
    {
      label: 'Bot',
      icon: Bot,
      color: 'var(--success)',
      link: `/events/${event.id}/bot`
    },
    {
      label: 'NewPay',
      icon: Store,
      color: 'var(--warning)',
      link: `/events/${event.id}/newpay`
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      color: 'var(--error)',
      link: `/events/${event.id}/analytics`
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">
            <div className="spinner"></div>
            Cargando eventos...
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
          <h1 className="page-title">Gestión de Eventos</h1>
          <p className="page-subtitle">
            Crea, edita y gestiona todos tus eventos desde un solo lugar
          </p>
        </div>

        {/* Create/Edit Event Form */}
        {showCreateForm && (
          <div className="card fade-in">
            <div className="card-header">
              <h2 className="card-title">
                {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
              </h2>
              <button 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingEvent(null);
                  setFormData({ name: '', description: '', date: '', venue: '', category_tags: '' });
                }}
                className="btn btn-secondary btn-sm"
              >
                Cancelar
              </button>
            </div>
            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Nombre del Evento</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ej: Conferencia de Tecnología 2025"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-input form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Describe tu evento..."
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Ubicación</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                    placeholder="Ej: Centro de Convenciones, Sala Principal"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categorías (separadas por comas)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.category_tags}
                    onChange={(e) => setFormData({ ...formData, category_tags: e.target.value })}
                    placeholder="Ej: tecnología, conferencia, networking"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  {editingEvent ? 'Actualizar Evento' : 'Crear Evento'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingEvent(null);
                    setFormData({ name: '', description: '', date: '', venue: '', category_tags: '' });
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Mis Eventos ({events.length})</h2>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Nuevo Evento
            </button>
          </div>

          {events.length > 0 ? (
            <div className="grid">
              {events.map((event) => {
                const eventDate = new Date(event.date);
                const isUpcoming = eventDate > new Date();
                
                return (
                  <div key={event.id} className="card slide-up">
                    <div className="card-header">
                      <div>
                        <h3 className="card-title">{event.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-600)' }}>
                            <Calendar size={14} style={{ marginRight: '4px' }} />
                            {eventDate.toLocaleDateString('es-ES')} {eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-600)' }}>
                            <MapPin size={14} style={{ marginRight: '4px' }} />
                            {event.venue}
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${isUpcoming ? 'badge-success' : 'badge-info'}`}>
                        {isUpcoming ? 'Próximo' : 'Finalizado'}
                      </span>
                    </div>

                    <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
                      {event.description}
                    </p>

                    {event.category_tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {event.category_tags.map((tag, index) => (
                          <span key={index} className="badge badge-info">
                            <Tag size={12} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Event Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      {eventActions(event).map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <Link
                            key={index}
                            to={action.link}
                            className="btn btn-secondary btn-sm"
                            style={{ borderLeft: `3px solid ${action.color}` }}
                          >
                            <Icon size={14} />
                            {action.label}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Management Actions */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
                      <button 
                        onClick={() => handleEditClick(event)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDuplicateEvent(event)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Copy size={14} />
                        Duplicar
                      </button>
                      <Link
                        to={`/event/${event.id}`}
                        target="_blank"
                        className="btn btn-primary btn-sm"
                      >
                        Ver Público
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-500)' }}>
              <Calendar size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
              <h3 style={{ marginBottom: '8px' }}>No hay eventos creados</h3>
              <p style={{ marginBottom: '24px' }}>Comienza creando tu primer evento</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
              >
                <Plus size={16} />
                Crear Primer Evento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventManager;