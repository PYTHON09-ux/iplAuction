import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentAuction, setCurrentAuction] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({});

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('ca_token');
    if (token) {
      api.me().then(a => setAdmin(a)).catch(() => localStorage.removeItem('ca_token')).finally(() => setAuthLoading(false));
    } else { setAuthLoading(false); }
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.login({ username, password });
    localStorage.setItem('ca_token', data.token);
    setAdmin(data.admin);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ca_token');
    setAdmin(null);
    setActiveEvent(null);
  }, []);

  const refreshPlayers = useCallback(async (params) => {
    const data = await api.getPlayers(params);
    setPlayers(data);
    return data;
  }, []);

  const refreshTeams = useCallback(async (params) => {
    const data = await api.getTeams(params);
    setTeams(data);
    return data;
  }, []);

  const refreshAuction = useCallback(async (params) => {
    const data = await api.getCurrentAuction(params);
    setCurrentAuction(data);
    return data;
  }, []);

  const refreshStats = useCallback(async (params) => {
    const data = await api.getAuctionStats(params);
    setStats(data);
    return data;
  }, []);

  const refreshEvents = useCallback(async () => {
    const data = await api.getEvents();
    setEvents(data);
    return data;
  }, []);

  return (
    <AppContext.Provider value={{
      admin, setAdmin, authLoading, login, logout,
      players, setPlayers,
      teams, setTeams,
      currentAuction, setCurrentAuction,
      stats, setStats,
      events, setEvents,
      activeEvent, setActiveEvent,
      toast, showToast,
      loading, setLoading,
      refreshPlayers, refreshTeams, refreshAuction, refreshStats, refreshEvents,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
