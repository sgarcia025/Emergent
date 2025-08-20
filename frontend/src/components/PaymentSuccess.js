import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import { API } from '../App';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollAttempts, setPollAttempts] = useState(0);

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    if (pollAttempts >= 10) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      setPaymentStatus(response.data);

      if (response.data.payment_status === 'paid') {
        setLoading(false);
      } else if (response.data.status === 'expired') {
        setLoading(false);
      } else {
        // Continue polling
        setTimeout(() => {
          setPollAttempts(prev => prev + 1);
          pollPaymentStatus();
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--gray-50)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Sesión no válida</h2>
          <p>No se encontró información de pago.</p>
          <Link to="/" className="btn btn-primary">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--gray-50)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', marginBottom: '24px' }}></div>
          <h2>Verificando tu pago...</h2>
          <p>Por favor espera mientras confirmamos tu transacción.</p>
        </div>
      </div>
    );
  }

  const isPaymentSuccessful = paymentStatus?.payment_status === 'paid';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--whatsapp-green-light) 0%, white 100%)',
      padding: '48px 24px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {isPaymentSuccessful ? (
          <div className="card fade-in" style={{ textAlign: 'center', padding: '48px' }}>
            <CheckCircle 
              size={80} 
              style={{ color: 'var(--success)', marginBottom: '24px' }} 
            />
            
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: 'var(--gray-900)',
              marginBottom: '16px'
            }}>
              ¡Pago Exitoso!
            </h1>
            
            <p style={{ 
              fontSize: '18px', 
              color: 'var(--gray-600)', 
              marginBottom: '32px' 
            }}>
              Tu ticket ha sido confirmado y enviado a tu email.
            </p>

            <div className="alert alert-success" style={{ textAlign: 'left', marginBottom: '32px' }}>
              <strong>Detalles de tu compra:</strong>
              <div style={{ marginTop: '12px' }}>
                <div>💰 Monto: ${(paymentStatus.amount_total / 100).toFixed(2)} {paymentStatus.currency.toUpperCase()}</div>
                <div>📧 Se enviará el ticket a tu email registrado</div>
                <div>🎟️ ID de sesión: {sessionId}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary">
                <Download size={16} />
                Descargar Ticket
              </button>
              
              <Link to="/dashboard" className="btn btn-secondary">
                <Calendar size={16} />
                Ver Mis Eventos
              </Link>
            </div>

            <div style={{ 
              marginTop: '32px', 
              padding: '24px', 
              background: 'var(--gray-50)', 
              borderRadius: '12px',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                ¿Qué sigue?
              </h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <CheckCircle size={16} style={{ color: 'var(--success)', marginRight: '8px' }} />
                  Revisa tu email para el ticket con código QR
                </li>
                <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <Clock size={16} style={{ color: 'var(--warning)', marginRight: '8px' }} />
                  Llega 30 minutos antes del evento
                </li>
                <li style={{ display: 'flex', alignItems: 'center' }}>
                  <Calendar size={16} style={{ color: 'var(--blue)', marginRight: '8px' }} />
                  Guarda la fecha en tu calendario
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="card fade-in" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'var(--error)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'white',
              fontSize: '32px'
            }}>
              ⚠️
            </div>
            
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: 'var(--gray-900)',
              marginBottom: '16px'
            }}>
              Pago no Completado
            </h1>
            
            <p style={{ 
              fontSize: '18px', 
              color: 'var(--gray-600)', 
              marginBottom: '32px' 
            }}>
              {paymentStatus?.status === 'expired' 
                ? 'La sesión de pago ha expirado.' 
                : 'El pago no se pudo procesar correctamente.'}
            </p>

            <div className="alert alert-warning" style={{ marginBottom: '32px' }}>
              <strong>Estado del pago:</strong> {paymentStatus?.payment_status || 'Desconocido'}
              <br />
              <strong>Estado de la sesión:</strong> {paymentStatus?.status || 'Desconocido'}
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => window.history.back()}
                className="btn btn-primary"
              >
                Intentar de Nuevo
              </button>
              
              <Link to="/" className="btn btn-secondary">
                Volver al Inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess;