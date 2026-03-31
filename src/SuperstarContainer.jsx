import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AayamScreen from './AayamScreen';
import LoginScreen from './LoginScreen';
import AdminScreen from './AdminScreen';
import RoundsScreen from './RoundsScreen';

const SuperstarContainer = () => {
  const [player, setPlayer] = useState(null);
  const [activeMode, setActiveMode] = useState('triple-threat'); // 'triple-threat' or 'mind-sync'
  const [activeGame, setActiveGame] = useState('contexto'); // 'contexto', 'grouping', 'wordle'
  const [activeInstance, setActiveInstance] = useState(1); // 1 or 2
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [globalTimerStarted, setGlobalTimerStarted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // AUTH: Token Verification on Mount
  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('aayam_player');
      if (stored) {
        const playerData = JSON.parse(stored);
        if (playerData.isAdmin) {
           setPlayer(playerData);
           return;
        }
        
        try {
          const res = await fetch('http://localhost:5000/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${playerData.token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPlayer({ ...data.player, token: playerData.token });
          } else {
            localStorage.removeItem('aayam_player');
            setPlayer(null);
          }
        } catch (err) {
            // If offline, keep local state
            setPlayer(playerData);
        }
      }
    };
    initAuth();
  }, []);

  const handleLogin = (playerData) => {
    setPlayer(playerData);
    localStorage.setItem('aayam_player', JSON.stringify(playerData));
  };

  const handleLogout = () => {
    setPlayer(null);
    localStorage.removeItem('aayam_player');
    setTimeLeft(600); // Reset for next user
  };

  // Routing logic
  if (!player && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="superstar-app-root min-h-screen w-full bg-[#03030f]">
      <Routes>
        <Route path="/login" element={
          player ? <Navigate to={player.isAdmin ? "/admin" : "/rounds"} replace /> : <LoginScreen onLogin={handleLogin} />
        } />
        
        <Route path="/admin/*" element={
          player?.isAdmin ? <AdminScreen onLogout={handleLogout} /> : <Navigate to="/login" replace />
        } />

        <Route path="/rounds" element={
          player && !player.isAdmin ? <RoundsScreen player={player} onLogout={handleLogout} /> : <Navigate to="/login" replace />
        } />

        <Route path="/round/:id/play" element={
          player && !player.isAdmin ? (
            <AayamScreen 
              activeMode={activeMode}
              setActiveMode={setActiveMode}
              activeGame={activeGame}
              setActiveGame={setActiveGame}
              activeInstance={activeInstance}
              setActiveInstance={setActiveInstance}
              timeLeft={timeLeft}
              setTimeLeft={setTimeLeft}
              timerActive={timerActive}
              player={player}
              onLogout={handleLogout}
              onGameStart={() => setGlobalTimerStarted(true)}
            />
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/" element={
           player ? <Navigate to={player.isAdmin ? "/admin" : "/rounds"} replace /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </div>
  );
};

export default SuperstarContainer;
