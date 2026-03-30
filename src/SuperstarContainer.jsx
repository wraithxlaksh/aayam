import React, { useState, useEffect } from 'react';
import AayamScreen from './AayamScreen';
import LoginScreen from './LoginScreen';

const SuperstarContainer = () => {
  const [player, setPlayer] = useState(null);
  const [activeMode, setActiveMode] = useState('triple-threat'); // 'triple-threat' or 'mind-sync'
  const [activeGame, setActiveGame] = useState('contexto'); // 'contexto', 'grouping', 'wordle'
  const [activeInstance, setActiveInstance] = useState(1); // 1 or 2
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [timerActive, setTimerActive] = useState(false);

  // AUTH: Ensure login is always shown first
  useEffect(() => {
    // Reset to standby on mount (as per request)
    localStorage.removeItem('aayam_player');
    setPlayer(null);
  }, []);

  const fetchSessionTimer = async (rollNumber) => {
    try {
      const response = await fetch(`http://localhost:5000/api/session/timer/${rollNumber}`);
      if (response.ok) {
        const data = await response.json();
        if (data.timeLeft !== null) {
          setTimeLeft(data.timeLeft);
        }
      }
    } catch (err) {
      console.warn("Offline: Using local timer.");
    }
  };

  const handleLogin = (playerData) => {
    setPlayer(playerData);
    localStorage.setItem('aayam_player', JSON.stringify(playerData));
    fetchSessionTimer(playerData.rollNumber);
  };

  const handleLogout = () => {
    setPlayer(null);
    localStorage.removeItem('aayam_player');
    setTimeLeft(600); // Reset for next user
  };

  const [globalTimerStarted, setGlobalTimerStarted] = useState(false);

  useEffect(() => {
    let interval = null;
    if (player && activeMode === 'triple-threat' && globalTimerStarted && timeLeft > 0) {
      setTimerActive(true);
      interval = setInterval(() => {
        setTimeLeft((prev) => {
           const next = prev - 1;
           // Heartbeat to sync timer to Redis
           if (next % 5 === 0) {
              syncTimerToServer(player.rollNumber, next);
           }
           return next;
        });
      }, 1000);
    } else {
      setTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [player, activeMode, timeLeft, globalTimerStarted]);

  const syncTimerToServer = async (rollNumber, time) => {
    try {
      await fetch('http://localhost:5000/api/session/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, timeLeft: time }),
      });
    } catch (err) {
      // Background sync fail is fine for dev
    }
  };

  if (!player) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="superstar-app-root h-screen overflow-hidden">
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
    </div>
  );
};

export default SuperstarContainer;
