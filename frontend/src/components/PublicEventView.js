import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, CreditCard, Users, Tag } from 'lucide-react';
import axios from 'axios';
import { API } from '../App';

function PublicEventView() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [attendeeData, setAttendeeData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}`);
      setEvent(response.data);
      if (response.data.ticket_types.length > 0) {
        setSelectedTicketType(response.data.ticket_types[0]);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicketType) return;

    setPurchasing(true);
    try {
      const purchaseData = {
        event_id: eventId,
        ticket_type_id: selectedTicketType.id,
        attendee_name: attendeeData.name,
        attendee_email: attendeeData.email,
        attendee_phone: attendeeData.phone,
        origin_url: window.location.origin
      };

      const response = await axios.post(`${API}/tickets/purchase`, purchaseData);
      
      // Redirect to Stripe checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      alert('Error al procesar la compra. Inténtalo de nuevo.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="public-event">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="loading">
            <div className="spinner"></div>
            Cargando evento...
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="public-event">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Evento no encontrado</h2>
            <p>El evento que buscas no existe o no está disponible.</p>
          </div>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  return (
    <div className="public-event">
      {/* Event Header */}
      <div className="public-event-header">
        <div className="public-event-title">{event.name}</div>
        <div className="public-event-date">
          {eventDate.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          })}
        </div>
      </div>

      <div className="public-event-content">
        {/* Event Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Detalles del Evento</h2>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--gray-700)' }}>
              {event.description}
            </p>
          </div>

          <div className="grid grid-2" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-600)' }}>
              <Calendar size={20} style={{ marginRight: '12px', color: 'var(--whatsapp-green)' }} />
              <div>
                <div style={{ fontWeight: '500' }}>Fecha y Hora</div>
                <div>{eventDate.toLocaleDateString('es-ES')} - {eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--gray-600)' }}>
              <MapPin size={20} style={{ marginRight: '12px', color: 'var(--whatsapp-green)' }} />
              <div>
                <div style={{ fontWeight: '500' }}>Ubicación</div>
                <div>{event.venue}</div>
              </div>
            </div>
          </div>

          {event.category_tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {event.category_tags.map((tag, index) => (
                <span key={index} className="badge badge-info">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Selection */}
        {isUpcoming && event.ticket_types.length > 0 && (
          <div className="ticket-selection">
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
              Selecciona tu Ticket
            </h2>

            <div style={{ marginBottom: '32px' }}>
              {event.ticket_types.map((ticketType) => (
                <div
                  key={ticketType.id}
                  className={`ticket-type ${selectedTicketType?.id === ticketType.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTicketType(ticketType)}
                >
                  <div className="ticket-info">
                    <h3>{ticketType.name}</h3>
                    <p style={{ color: 'var(--gray-600)', margin: '4px 0' }}>
                      {ticketType.description || 'Entrada general al evento'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      Disponibles: {ticketType.stock} | Máximo por persona: {ticketType.max_per_person}
                    </p>
                  </div>
                  <div className="ticket-price">${ticketType.price}</div>
                </div>
              ))}
            </div>

            {/* Purchase Form */}
            {selectedTicketType && (
              <form onSubmit={handlePurchaseTicket} className="fade-in">
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>
                  Información del Asistente
                </h3>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre Completo *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={attendeeData.name}
                      onChange={(e) => setAttendeeData({ ...attendeeData, name: e.target.value })}
                      required
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={attendeeData.email}
                      onChange={(e) => setAttendeeData({ ...attendeeData, email: e.target.value })}
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono (opcional)</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={attendeeData.phone}
                    onChange={(e) => setAttendeeData({ ...attendeeData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div style={{ 
                  background: 'var(--gray-50)', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  marginBottom: '24px',
                  border: '2px solid var(--whatsapp-green-light)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>
                        {selectedTicketType.name}
                      </div>
                      <div style={{ color: 'var(--gray-600)', fontSize: '14px' }}>
                        {event.name}
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--whatsapp-green)' }}>
                      ${selectedTicketType.price}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={purchasing || selectedTicketType.stock === 0}
                >
                  {purchasing ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Comprar Ticket - ${selectedTicketType.price}
                    </>
                  )}
                </button>

                <p style={{ 
                  textAlign: 'center', 
                  fontSize: '12px', 
                  color: 'var(--gray-500)', 
                  marginTop: '16px' 
                }}>
                  Pago seguro procesado por Stripe. Recibirás tu ticket por email.
                </p>
              </form>
            )}
          </div>
        )}

        {!isUpcoming && (
          <div className="card" style={{ textAlign: 'center' }}>
            <Clock size={48} style={{ color: 'var(--gray-400)', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Evento Finalizado</h3>
            <p>Este evento ya ha terminado. ¡Gracias por tu interés!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicEventView;