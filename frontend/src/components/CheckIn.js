import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Users, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { AuthContext, API } from '../App';
import Sidebar from './Sidebar';

function CheckIn() {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [checkInStats, setCheckInStats] = useState({ total: 0, checkedIn: 0, pending: 0 });
  const [manualQrCode, setManualQrCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventData();
    fetchCheckInStats();
  }, [eventId]);

  useEffect(() => {
    if (isScanning) {
      initializeScanner();
    }
    
    return () => {
      // Cleanup scanner when component unmounts or scanning stops
      if (window.html5QrcodeScanner) {
        window.html5QrcodeScanner.clear();
      }
    };
  }, [isScanning]);

  const fetchEventData = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckInStats = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/analytics`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setCheckInStats({
        total: response.data.total_tickets_sold,
        checkedIn: response.data.checked_in_count,
        pending: response.data.total_tickets_sold - response.data.checked_in_count
      });
    } catch (error) {
      console.error('Error fetching check-in stats:', error);
    }
  };

  const initializeScanner = () => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    const html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", config, false);
    window.html5QrcodeScanner = html5QrcodeScanner;

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  };

  const onScanSuccess = async (decodedText) => {
    setIsScanning(false);
    if (window.html5QrcodeScanner) {
      window.html5QrcodeScanner.clear();
    }
    
    await processCheckIn(decodedText);
  };

  const onScanFailure = (error) => {
    // Handle scan failure, usually better to ignore
    console.log(`QR scan failed: ${error}`);
  };

  const processCheckIn = async (qrCode) => {
    try {
      const response = await axios.post(`${API}/checkin`, {
        qr_code: qrCode
      });

      const result = {
        ...response.data,
        timestamp: new Date(),
        qr_code: qrCode
      };

      setScanResult(result);
      
      // Add to recent check-ins
      setRecentCheckIns(prev => [result, ...prev.slice(0, 9)]);
      
      // Update stats
      if (result.status === 'valid') {
        setCheckInStats(prev => ({
          ...prev,
          checkedIn: prev.checkedIn + 1,
          pending: prev.pending - 1
        }));
      }

      // Clear result after 5 seconds
      setTimeout(() => setScanResult(null), 5000);
    } catch (error) {
      console.error('Error processing check-in:', error);
      setScanResult({
        status: 'error',
        message: 'Error al procesar el check-in',
        timestamp: new Date()
      });
      setTimeout(() => setScanResult(null), 5000);
    }
  };

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (manualQrCode.trim()) {
      await processCheckIn(manualQrCode.trim());
      setManualQrCode('');
    }
  };

  const startScanning = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (window.html5QrcodeScanner) {
      window.html5QrcodeScanner.clear();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <CheckCircle size={24} style={{ color: 'var(--success)' }} />;
      case 'duplicate':
        return <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />;
      case 'expired':
      case 'not_activated':
        return <XCircle size={24} style={{ color: 'var(--error)' }} />;
      default:
        return <XCircle size={24} style={{ color: 'var(--error)' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return 'var(--success)';
      case 'duplicate':
        return 'var(--warning)';
      case 'expired':
      case 'not_activated':
      case 'error':
        return 'var(--error)';
      default:
        return 'var(--gray-500)';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">
            <div className="spinner"></div>
            Cargando sistema de check-in...
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
            <h1 className="page-title">Control de Acceso</h1>
            <p className="page-subtitle">
              {event?.name} - Escanea códigos QR para validar tickets
            </p>
          </div>
          <Link to="/events" className="btn btn-secondary">
            ← Volver a Eventos
          </Link>
        </div>

        {/* Check-in Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{checkInStats.total}</div>
            <div className="stat-label">Tickets Vendidos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{checkInStats.checkedIn}</div>
            <div className="stat-label">Check-ins Realizados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{checkInStats.pending}</div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {checkInStats.total > 0 ? ((checkInStats.checkedIn / checkInStats.total) * 100).toFixed(1) : 0}%
            </div>
            <div className="stat-label">Tasa de Asistencia</div>
          </div>
        </div>

        <div className="grid grid-2">
          {/* QR Scanner */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Escáner QR</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isScanning ? (
                  <button onClick={startScanning} className="btn btn-primary btn-sm">
                    <Camera size={16} />
                    Iniciar Escáner
                  </button>
                ) : (
                  <button onClick={stopScanning} className="btn btn-secondary btn-sm">
                    Detener Escáner
                  </button>
                )}
              </div>
            </div>

            {isScanning ? (
              <div>
                <div id="qr-reader" style={{ width: '100%' }}></div>
                <div className="alert alert-info" style={{ marginTop: '16px' }}>
                  <strong>Instrucciones:</strong>
                  <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                    <li>Centra el código QR en el marco</li>
                    <li>Mantén la cámara estable</li>
                    <li>Asegúrate de tener buena iluminación</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-500)' }}>
                <QrCode size={64} style={{ marginBottom: '16px', opacity: '0.5' }} />
                <h3 style={{ marginBottom: '8px' }}>Escáner QR Inactivo</h3>
                <p style={{ marginBottom: '24px' }}>Haz clic en "Iniciar Escáner" para comenzar</p>
              </div>
            )}

            {/* Manual QR Input */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--gray-200)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                Entrada Manual de Código
              </h3>
              <form onSubmit={handleManualCheckIn} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  value={manualQrCode}
                  onChange={(e) => setManualQrCode(e.target.value)}
                  placeholder="Ingresa el código QR manualmente"
                />
                <button type="submit" className="btn btn-primary">
                  Validar
                </button>
              </form>
            </div>
          </div>

          {/* Scan Result */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Resultado del Escaneo</h2>
            </div>

            {scanResult ? (
              <div className="fade-in" style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  {getStatusIcon(scanResult.status)}
                </div>
                
                <h3 style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: getStatusColor(scanResult.status),
                  marginBottom: '12px'
                }}>
                  {scanResult.status === 'valid' ? '✅ Check-in Exitoso' :
                   scanResult.status === 'duplicate' ? '⚠️ Ticket Ya Usado' :
                   scanResult.status === 'expired' ? '❌ Ticket Expirado' :
                   '❌ Ticket Inválido'}
                </h3>

                <p style={{ fontSize: '16px', color: 'var(--gray-600)', marginBottom: '16px' }}>
                  {scanResult.message}
                </p>

                {scanResult.attendee_name && (
                  <div style={{ 
                    background: 'var(--gray-50)', 
                    padding: '16px', 
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '18px' }}>
                      {scanResult.attendee_name}
                    </div>
                    <div style={{ color: 'var(--gray-600)', fontSize: '14px' }}>
                      Tipo: {scanResult.ticket_type}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  {scanResult.timestamp.toLocaleTimeString('es-ES')}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-500)' }}>
                <Users size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
                <h3 style={{ marginBottom: '8px' }}>Listo para Check-in</h3>
                <p>Escanea un código QR para validar el ticket</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Check-ins */}
        {recentCheckIns.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Check-ins Recientes</h2>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Asistente</th>
                    <th>Estado</th>
                    <th>Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCheckIns.map((checkIn, index) => (
                    <tr key={index}>
                      <td>{checkIn.timestamp.toLocaleTimeString('es-ES')}</td>
                      <td>
                        {checkIn.attendee_name ? (
                          <div>
                            <div style={{ fontWeight: '600' }}>{checkIn.attendee_name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                              {checkIn.ticket_type}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray-500)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          checkIn.status === 'valid' ? 'badge-success' :
                          checkIn.status === 'duplicate' ? 'badge-warning' :
                          'badge-error'
                        }`}>
                          {checkIn.status === 'valid' ? 'Válido' :
                           checkIn.status === 'duplicate' ? 'Duplicado' :
                           checkIn.status === 'expired' ? 'Expirado' :
                           'Error'}
                        </span>
                      </td>
                      <td>{checkIn.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckIn;