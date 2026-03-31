import React, { useState, useEffect } from 'react';
import { Type, Play, Timer, Binary, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';

const PHYSICS_WORDS = [
  "FORCE","LIGHT","SPEED","POWER","LASER","GAMMA","FIELD","SOUND","QUARK","BOSON",
  "ALPHA","PULSE","RADIO","IMAGE","FOCUS","CLOCK","RADAR","WAVES","DECAY","PHASE",
  "PLANE","PRESS","DENSE","ENERG","MOTOR","ATOMS","PLANK","ORBIT","MAGIC","SOLAR",
  "IONIC","FLUID","TORUS","DRIVE","SPARK","CHARG","FRAME","ANGLE","UNITY","VIBES",
  "THERM","GRAVY","MASSY","ELECT","OPTIC","SONIC","FORMS","DELTA","OMEGA","SIGMA"
];

const KEYS = [
  "QWERTYUIOP",
  "ASDFGHJKL",
  "ZXCVBNM"
];

const Wordle_Superstar = ({ timeLeft, instance, syncScoreToServer, rollNumber, onGameStart }) => {

  const getRandomWord = () => {
    return PHYSICS_WORDS[Math.floor(Math.random() * PHYSICS_WORDS.length)];
  };

  const [solution, setSolution] = useState(getRandomWord);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [timeout, setTimeoutState] = useState(false);
  const [keyStatus, setKeyStatus] = useState({});
  const gameId = `wordle-${instance}`;
  const getKeyClass = (key) => {
  const status = keyStatus?.[key];

  if (status === 'correct') return 'bg-cyan-500 text-white';
  if (status === 'present') return 'bg-amber-400 text-black';
  if (status === 'absent') return 'bg-slate-900 text-slate-500';

  return 'bg-slate-800 text-white';
};
  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/progress/load/${rollNumber}/${gameId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            if (data.progress.solution) setSolution(data.progress.solution);
            setGuesses(data.progress.guesses || []);
            setWon(data.progress.won || false);
            setGameOver(data.progress.gameOver || false);
            setTimeoutState(data.progress.timeout || false);
            setKeyStatus(data.progress.keyStatus);
          }
        }
      } catch (err) {}
    };
    if (rollNumber) loadState();
  }, [rollNumber, gameId]);

  useEffect(() => {
    if (!rollNumber || (!guesses.length && !won && !gameOver && !timeout)) return;
    const saveState = async () => {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/progress/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollNumber, gameId, progress: { solution, guesses, won, gameOver, timeout } })
        });
      } catch (err) {}
    };
    saveState();
  }, [solution, guesses, won, gameOver, timeout, rollNumber, gameId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (timeLeft <= 0 || won || gameOver || timeout) return;

      if (e.key === 'Enter') {
        if (currentGuess.length !== 5) {
          showMessage('Word must be 5 letters');
          return;
        }
        submitGuess();
      } else if (e.key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[A-Za-z]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess(prev => (prev + e.key).toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, timeLeft, won, gameOver, timeout]);

  const handleStart = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, gameType: 'wordle', instance }),
      });
    } catch (err) {}
    if (onGameStart) onGameStart();
  };

  useEffect(() => {
    handleStart();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };
 const submitGuess = async () => {
  const newGuesses = [...guesses, currentGuess];
  setGuesses(newGuesses);

  // ✅ UPDATE KEY COLORS
  const newKeyStatus = { ...keyStatus };

  currentGuess.split('').forEach((letter, i) => {
    if (solution[i] === letter) {
      newKeyStatus[letter] = 'correct';
    } else if (solution.includes(letter)) {
      if (newKeyStatus[letter] !== 'correct') {
        newKeyStatus[letter] = 'present';
      }
    } else {
      if (!newKeyStatus[letter]) {
        newKeyStatus[letter] = 'absent';
      }
    }
  });

  setKeyStatus(newKeyStatus);

  // existing logic
  if (currentGuess === solution) {
    setWon(true);
    setGameOver(true);
    if (syncScoreToServer) syncScoreToServer('wordle', { attempts: newGuesses.length });
  } else if (newGuesses.length >= 6) {
    setGameOver(true);
    if (syncScoreToServer) syncScoreToServer('wordle', { attempts: 7 });
  }

  setCurrentGuess('');
};

  useEffect(() => {
    if (timeLeft <= 0 && !won && !gameOver && !timeout && guesses.length > 0) {
       if (syncScoreToServer) syncScoreToServer('wordle', { attempts: 7 });
    }
  }, [timeLeft, won, gameOver, timeout, guesses, syncScoreToServer]);

  const getLetterClass = (letter, index) => {
    if (solution[index] === letter) return 'bg-cyan-500 border-cyan-400 text-white';
    if (solution.includes(letter)) return 'bg-amber-500 border-amber-400 text-white';
    return 'bg-slate-800 border-slate-700 text-slate-500';
  };

  // 🔥 Keyboard handler
  const handleKeyClick = (key) => {
    if (timeLeft <= 0 || won || gameOver || timeout) return;

    if (key === "ENTER") {
      if (currentGuess.length !== 5) {
        showMessage("Word must be 5 letters");
        return;
      }
      submitGuess();
    } else if (key === "BACK") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  return (
    <div className="w-full text-white flex flex-col gap-4 items-center h-full">

      <div className="grid grid-rows-6 gap-2">
        {[...Array(6)].map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length && !won && !gameOver;
          const isPastRow = rowIndex < guesses.length;
          const guess = isPastRow ? guesses[rowIndex] : (isCurrentRow ? currentGuess : '');

          return (
            <div key={rowIndex} className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, colIndex) => {
                const letter = guess[colIndex] || '';
                const statusClass = isPastRow 
                  ? getLetterClass(letter, colIndex) 
                  : 'border-white/10';

                return (
                  <div key={colIndex} className={`w-9 h-9  border flex items-center justify-center text-xl font-bold ${statusClass}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 🔥 KEYBOARD */}
      <div className="w-full max-w-sm flex flex-col gap-1 mt-2">
  {KEYS.map((row, i) => (
    <div key={i} className="flex justify-center gap-1">
      
      {i === 2 && (
        <button
          onClick={() => handleKeyClick("ENTER")}
          className="px-2 h-8 text-[9px] bg-indigo-500/20 rounded-md"
        >
          ENT
        </button>
      )}

      {row.split("").map((key) => (
        <button
          key={key}
          onClick={() => handleKeyClick(key)}
className={`flex-1 h-8 max-w-[32px] rounded-md text-[11px] font-bold transition ${getKeyClass(key)}`}        >
          {key}
        </button>
      ))}

      {i === 2 && (
        <button
          onClick={() => handleKeyClick("BACK")}
          className="px-2 h-8 text-[10px] bg-red-500/20 rounded-md"
        >
          ⌫
        </button>
      )}

    </div>
  ))}
</div>

    </div>
  );
};

export default Wordle_Superstar;