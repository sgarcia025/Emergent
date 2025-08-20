import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bot, MessageCircle, Plus, Edit, Trash2, Send, HelpCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { AuthContext, API } from '../App';
import Sidebar from './Sidebar';

function BotConfig() {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [botConfig, setBotConfig] = useState(null);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [showBotTest, setShowBotTest] = useState(false);
  const [faqFormData, setFaqFormData] = useState({ question: '', answer: '' });
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingBot, setTestingBot] = useState(false);

  useEffect(() => {
    fetchEventData();
    fetchFaqs();
  }, [eventId]);

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

  const fetchFaqs = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/faqs`);
      setFaqs(response.data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
  };

  const handleCreateFaq = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/events/${eventId}/faqs`, faqFormData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setFaqs([response.data, ...faqs]);
      setShowFaqForm(false);
      setFaqFormData({ question: '', answer: '' });
    } catch (error) {
      console.error('Error creating FAQ:', error);
    }
  };

  const handleTestBot = async (e) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    setTestingBot(true);
    const userMessage = { type: 'user', content: testMessage, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    
    try {
      const response = await axios.post(`${API}/bot/query`, {
        event_id: eventId,
        message: testMessage,
        session_id: `test_${Date.now()}`
      });

      const botMessage = { 
        type: 'bot', 
        content: response.data.response, 
        timestamp: new Date() 
      };
      setChatHistory(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error testing bot:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Error: No se pudo procesar la consulta.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setTestingBot(false);
      setTestMessage('');
    }
  };

  const predefinedQuestions = [
    "¿Cuál es la dirección del evento?",
    "¿A qué hora comienza el evento?",
    "¿Hay estacionamiento disponible?",
    "¿Qué debo llevar al evento?",
    "¿Puedo cancelar mi ticket?",
    "¿Hay descuentos disponibles?"
  ];

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content">
          <div className="loading">
            <div className="spinner"></div>
            Cargando configuración del bot...
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
            <h1 className="page-title">Bot de WhatsApp</h1>
            <p className="page-subtitle">
              {event?.name} - Configura el asistente virtual para tus asistentes
            </p>
          </div>
          <Link to="/events" className="btn btn-secondary">
            ← Volver a Eventos
          </Link>
        </div>

        <div className="grid grid-2">
          {/* FAQ Management */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Preguntas Frecuentes</h2>
              <button 
                onClick={() => setShowFaqForm(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                Nueva FAQ
              </button>
            </div>

            {showFaqForm && (
              <div className="fade-in" style={{ marginBottom: '24px', padding: '20px', background: 'var(--gray-50)', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '16px' }}>Agregar Nueva FAQ</h3>
                <form onSubmit={handleCreateFaq}>
                  <div className="form-group">
                    <label className="form-label">Pregunta</label>
                    <input
                      type="text"
                      className="form-input"
                      value={faqFormData.question}
                      onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                      required
                      placeholder="¿Cuál es tu pregunta?"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Respuesta</label>
                    <textarea
                      className="form-input form-textarea"
                      value={faqFormData.answer}
                      onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                      required
                      placeholder="Respuesta detallada..."
                      rows="4"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Plus size={16} />
                      Agregar FAQ
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowFaqForm(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {faqs.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {faqs.map((faq, index) => (
                  <div key={faq.id || index} className="slide-up" style={{ 
                    padding: '16px', 
                    border: '1px solid var(--gray-200)', 
                    borderRadius: '12px', 
                    marginBottom: '12px',
                    background: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: 'var(--whatsapp-green)',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <HelpCircle size={16} style={{ marginRight: '8px' }} />
                          {faq.question}
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--gray-700)', margin: 0 }}>
                          {faq.answer}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                          <Edit size={12} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                <HelpCircle size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
                <h3 style={{ marginBottom: '8px' }}>No hay FAQs</h3>
                <p style={{ marginBottom: '20px' }}>Agrega preguntas frecuentes para entrenar el bot</p>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                    Sugerencias de preguntas:
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    {predefinedQuestions.slice(0, 3).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFaqFormData({ question, answer: '' });
                          setShowFaqForm(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '12px' }}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowFaqForm(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={16} />
                  Crear Primera FAQ
                </button>
              </div>
            )}
          </div>

          {/* Bot Testing */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Probar Bot</h2>
              <button 
                onClick={() => setChatHistory([])}
                className="btn btn-secondary btn-sm"
              >
                Limpiar Chat
              </button>
            </div>

            <div className="chat-container">
              <div className="chat-messages">
                {chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-500)' }}>
                    <Bot size={48} style={{ marginBottom: '16px', opacity: '0.5' }} />
                    <h3 style={{ marginBottom: '8px' }}>Bot Listo</h3>
                    <p>Envía un mensaje para probar el bot</p>
                  </div>
                ) : (
                  chatHistory.map((message, index) => (
                    <div key={index} className={`chat-message ${message.type}`}>
                      <div className="chat-message-content">
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                
                {testingBot && (
                  <div className="chat-message bot">
                    <div className="chat-message-content">
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Procesando...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleTestBot} className="chat-input-container">
                <input
                  type="text"
                  className="chat-input"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  disabled={testingBot}
                />
                <button 
                  type="submit" 
                  className="chat-send-btn"
                  disabled={testingBot || !testMessage.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Preguntas de prueba:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {predefinedQuestions.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setTestMessage(question)}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bot Configuration */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Configuración del Bot</h2>
            <span className="badge badge-success">
              <Sparkles size={12} />
              Powered by GPT-4o
            </span>
          </div>

          <div className="grid grid-2">
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Mensajes Automáticos
              </h3>
              
              <div className="form-group">
                <label className="form-label">Mensaje de Bienvenida</label>
                <textarea
                  className="form-input form-textarea"
                  defaultValue="¡Bienvenido al evento! ¿En qué puedo ayudarte?"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mensaje de Recordatorio</label>
                <textarea
                  className="form-input form-textarea"
                  defaultValue="Recuerda llegar 30 minutos antes del evento."
                  rows="3"
                />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Configuraciones Avanzadas
              </h3>

              <div className="form-group">
                <label className="form-label">Personalidad del Bot</label>
                <textarea
                  className="form-input form-textarea"
                  defaultValue="Eres un asistente virtual amigable y útil para eventos. Responde de manera profesional pero cálida."
                  rows="4"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ marginRight: '8px' }} />
                  Respuestas automáticas habilitadas
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-primary">
              <Bot size={16} />
              Guardar Configuración
            </button>
            <button className="btn btn-secondary">
              <MessageCircle size={16} />
              Integrar con WhatsApp
            </button>
          </div>
        </div>

        {/* Integration Instructions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Integración con WhatsApp</h2>
          </div>

          <div className="alert alert-info">
            <strong>¿Cómo funciona?</strong>
            <p style={{ marginTop: '8px', marginBottom: '0' }}>
              El bot utiliza las FAQs que configures para responder automáticamente a las consultas de tus asistentes. 
              Las respuestas son generadas por inteligencia artificial basándose en la información que proporciones.
            </p>
          </div>

          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Pasos para la integración:
            </h3>
            <ol style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>Configura todas las FAQs necesarias</li>
              <li style={{ marginBottom: '8px' }}>Guarda la configuración del bot</li>
              <li style={{ marginBottom: '8px' }}>Conecta tu número de WhatsApp Business</li>
              <li style={{ marginBottom: '8px' }}>Prueba el bot con mensajes reales</li>
              <li>¡Listo! Tu bot responderá automáticamente</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BotConfig;