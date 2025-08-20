import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Dashboard from './components/Dashboard';
import EventManager from './components/EventManager';
import TicketSales from './components/TicketSales';
import CheckIn from './components/CheckIn';
import BotConfig from './components/BotConfig';
import NewPayManager from './components/NewPayManager';
import Analytics from './components/Analytics';
import PublicEventView from './components/PublicEventView';
import PaymentSuccess from './components/PaymentSuccess';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock authentication context
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'user1',
    organization_id: 'org1',
    email: 'admin@whatsnew.com',
    name: 'Admin User',
    token: 'mock-jwt-token'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, setUser, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<EventManager />} />
            <Route path="/events/:eventId/tickets" element={<TicketSales />} />
            <Route path="/events/:eventId/checkin" element={<CheckIn />} />
            <Route path="/events/:eventId/bot" element={<BotConfig />} />
            <Route path="/events/:eventId/newpay" element={<NewPayManager />} />
            <Route path="/events/:eventId/analytics" element={<Analytics />} />
            <Route path="/event/:eventId" element={<PublicEventView />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export { AuthContext, API };
export default App;