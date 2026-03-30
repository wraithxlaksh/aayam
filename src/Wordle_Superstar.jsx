import React, { useState, useEffect } from 'react';
import { Type, Play, Timer, Binary, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';

const PHYSICS_WORDS = [
  'FORCE', 'LIGHT', 'SPEED', 'POWER', 'LASER', 
  'GAMMA', 'FIELD', 'SOUND', 'QUARK', 'BOSON', 
  'ALPHA', 'PULSE', 'RADIO', 'IMAGE', 'FOCUS', 
  'CLOCK', 'RADAR', 'WAVES', 'DECAY', 'PHASE'
];

const Wordle_Superstar = ({ timeLeft, instance, syncScoreToServer, rollNumber, gameCountdown, isGameRunning, startInstanceTimer, stopInstanceTimer }) => {
  const [solution] = useState(() => PHYSICS_WORDS[((instance - 1) + Math.floor(Math.random() * PHYSICS_WORDS.length)) % PHYSICS_WORDS.length]);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [timeout, setTimeoutState] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (timeLeft <= 0 || won || gameOver || !isGameRunning || timeout) return;

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
  }, [currentGuess, timeLeft, won, gameOver, isGameRunning, timeout]);

  // Monitor Countdown for Timeout
  useEffect(() => {
    if (isGameRunning && gameCountdown <= 0 && !won) {
      setTimeoutState(true);
      stopInstanceTimer();
    }
  }, [gameCountdown, isGameRunning, won]);

  const handleStart = async () => {
    if (timeout || gameOver) return;
    try {
      await fetch('http://localhost:5000/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, gameType: 'wordle', instance }),
      });
    } catch (err) {}
    startInstanceTimer();
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };

  const submitGuess = async () => {
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    
    if (currentGuess === solution) {
      setWon(true);
      setGameOver(true);
      stopInstanceTimer();
      try {
        await fetch('http://localhost:5000/api/game/end', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ rollNumber, gameType: 'wordle', instance, baseScore: 120 }),
        });
      } catch (err) {
        if (syncScoreToServer) syncScoreToServer(120);
      }
    } else if (newGuesses.length >= 6) {
      setGameOver(true);
      stopInstanceTimer();
    }
    
    setCurrentGuess('');
  };

  const getLetterClass = (letter, index) => {
    if (solution[index] === letter) return 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]';
    if (solution.includes(letter)) return 'bg-amber-500 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]';
    return 'bg-slate-800 border-slate-700 text-slate-500';
  };

  return (
    <div className="w-full text-white font-sans flex flex-col gap-4 items-center h-full overflow-hidden relative pb-2 select-none">
      
      {!isGameRunning && !timeout && !won && !gameOver && (
        <div className="absolute inset-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 rounded-3xl animate-in fade-in duration-300">
           <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/10">
              <Type className="text-indigo-400" size={40} />
           </div>
           <h3 className="text-2xl font-black italic tracking-widest text-white mb-2 uppercase italic tracking-tighter">PROTOCOL: WORDLE {instance}</h3>
           <p className="text-slate-500 text-[10px] text-center max-w-[240px] leading-relaxed uppercase tracking-[0.3em] font-bold mb-10">
              Keyword Decryption Protocol. 3-Minute Limit.
           </p>
           <button 
             onClick={handleStart}
             className="bg-white text-black px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-white/10"
           >
              <Play size={16} fill="currentColor" /> START
           </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center w-full px-2 shrink-0">
        <div className="flex flex-col">
           <h2 className="text-lg font-black italic tracking-widest text-indigo-400 uppercase leading-none">Wordle {instance}</h2>
           <span className={`text-[7px] font-bold uppercase tracking-widest mt-2 ${won ? 'text-emerald-500' : (timeout ? 'text-red-500' : (gameOver ? 'text-red-400' : 'text-slate-600'))}`}>
             Status: {won ? 'DECODED' : (timeout ? 'HALTED' : (gameOver ? 'LOCKED' : 'READY'))}
           </span>
        </div>
      </div>

      <div className="bg-slate-900/40 p-5 rounded-[2.5rem] border border-white/5 shadow-inner flex flex-col items-center gap-4 w-full max-w-sm flex-1 min-h-0 relative">
        <div className="grid grid-rows-6 gap-2 flex-1 min-h-0">
          {[...Array(6)].map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length && !won && !gameOver && timeLeft > 0 && isGameRunning && !timeout;
            const isPastRow = rowIndex < guesses.length;
            const guess = isPastRow ? guesses[rowIndex] : (isCurrentRow ? currentGuess : '');

            return (
              <div key={rowIndex} className="grid grid-cols-5 gap-2 h-full">
                {[...Array(5)].map((_, colIndex) => {
                  const letter = guess[colIndex] || '';
                  const statusClass = isPastRow 
                    ? getLetterClass(letter, colIndex) 
                    : (letter 
                        ? 'border-indigo-500 scale-105 bg-slate-900 shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                        : 'border-white/5 bg-slate-950/20 opacity-30');
                  
                  return (
                    <div 
                      key={colIndex}
                      className={`aspect-square w-10 h-10 md:w-12 md:h-12 border flex items-center justify-center text-lg md:text-xl font-black rounded-xl transition-all duration-500 ${statusClass}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Messaging Area */}
        <div className="h-4 flex items-center justify-center shrink-0">
           {message && <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] animate-pulse italic">{message}</span>}
        </div>

        {(won || gameOver || timeout) && (
          <div className={`absolute inset-x-4 bottom-4 p-8 rounded-[2rem] border text-center animate-in slide-in-from-bottom duration-500 shadow-3xl z-[60] 
            ${won ? 'bg-emerald-950/20 border-emerald-500/20 shadow-emerald-500/10' : (timeout ? 'bg-red-950/80 border-red-500/20 shadow-red-500/10' : 'bg-red-950/20 border-red-500/20')}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border 
                ${won ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
               {won ? <ShieldCheck className="text-emerald-400" size={32} /> : (timeout ? <AlertTriangle className="text-red-500" size={32} /> : <XCircle className="text-red-400" size={32} />)}
            </div>
            <h3 className={`text-xl font-black italic tracking-widest uppercase ${won ? 'text-emerald-400' : 'text-red-400'}`}>
              {won ? 'ACCESS GRANTED' : (timeout ? 'SYSTEM TIMEOUT' : (timeLeft <= 0 ? 'TIME EXHAUSTED' : 'PROTOCOL REJECTED'))}
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60 mt-2">
               {won ? 'Quantum link established.' : (timeout ? 'Transmission window expired.' : `Keyword: ${solution}`)}
            </p>
          </div>
        ) }
      </div>
      
      {!won && !gameOver && !timeout && isGameRunning && (
        <div className="text-center opacity-30 shrink-0">
           <p className="text-[8px] text-slate-600 uppercase tracking-[0.4em] font-medium italic">TYPE LETTERS • ENTER TO VERIFY • BACKSPACE TO EDIT</p>
        </div>
      )}
    </div>
  );
};

export default Wordle_Superstar;
