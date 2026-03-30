import React, { useState, useEffect } from 'react';
import { LayoutGrid, Play, Timer, CheckCircle2, XCircle, Binary, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { name: "SUBATOMIC", words: ["QUARK", "LEPTON", "BOSON", "NEUTRINO"], color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { name: "LAWS", words: ["NEWTON", "KEPLER", "SNELL", "OHM"], color: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
  { name: "CONSTANTS", words: ["PLANCK", "BOLTZMANN", "HUBBLE", "FARADAY"], color: "bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-600/30" },
  { name: "UNITS", words: ["JOULE", "TESLA", "KELVIN", "PASCAL"], color: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" }
];

const INITIAL_WORDS = CATEGORIES.flatMap(cat => cat.words);

const Grouping_Superstar = ({ timeLeft, instance, syncScoreToServer, rollNumber, gameCountdown, isGameRunning, startInstanceTimer, stopInstanceTimer }) => {
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeout, setTimeoutState] = useState(false);

  useEffect(() => {
    setWords([...INITIAL_WORDS].sort(() => Math.random() - 0.5));
  }, []);

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
        body: JSON.stringify({ rollNumber, gameType: 'grouping', instance }),
      });
    } catch (err) {}
    startInstanceTimer();
  };

  const handleSelect = (word) => {
    if (timeLeft <= 0 || won || gameOver || !isGameRunning || timeout) return;
    if (completed.some(cat => cat.words.includes(word))) return;

    if (selected.includes(word)) {
      setSelected(selected.filter(w => w !== word));
    } else if (selected.length < 4) {
      const nextSelected = [...selected, word];
      setSelected(nextSelected);
      if (nextSelected.length === 4) {
        checkGroup(nextSelected);
      }
    }
  };

  const checkGroup = async (selectedWords) => {
    const matchedCategory = CATEGORIES.find(cat => cat.words.every(w => selectedWords.includes(w)));
    
    if (matchedCategory) {
      const newCompleted = [...completed, matchedCategory];
      setCompleted(newCompleted);
      setSelected([]);
      if (newCompleted.length === 4) {
        setWon(true);
        stopInstanceTimer();
        try {
          await fetch('http://localhost:5000/api/game/end', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ rollNumber, gameType: 'grouping', instance, baseScore: 150 }),
          });
        } catch (err) {
          if (syncScoreToServer) syncScoreToServer(150);
        }
      }
    } else {
      setMistakes(prev => prev + 1);
      setTimeout(() => {
        setSelected([]);
        if (mistakes + 1 >= 5) {
            setGameOver(true);
            stopInstanceTimer();
        }
      }, 500);
    }
  };

  return (
    <div className="w-full text-white font-sans flex flex-col gap-4 items-center h-full overflow-hidden relative select-none">
      
      {!isGameRunning && !timeout && !won && !gameOver && (
        <div className="absolute inset-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 rounded-3xl animate-in fade-in duration-300">
           <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/10">
              <LayoutGrid className="text-indigo-400" size={40} />
           </div>
           <h3 className="text-2xl font-black italic tracking-widest text-white mb-2 uppercase italic tracking-tighter">PROTOCOL: GROUPING {instance}</h3>
           <p className="text-slate-500 text-[10px] text-center max-w-[240px] leading-relaxed uppercase tracking-[0.3em] font-bold mb-10">
              Categorical Analysis Required. 180s Time Window.
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
           <h2 className="text-lg font-black italic tracking-widest text-indigo-400 uppercase leading-none">Grouping {instance}</h2>
           <div className="flex gap-1.5 mt-2">
             {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-4 h-1.5 rounded-full transition-all duration-500 ${i < mistakes ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-800'}`}></div>
             ))}
           </div>
        </div>
      </div>

      {/* Categories area */}
      <div className="grid grid-cols-1 gap-2 w-full shrink-0">
        {completed.map((cat, idx) => (
          <div key={idx} className={`${cat.color} p-4 rounded-2xl flex items-center justify-between border animate-in slide-in-from-top duration-500`}>
             <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black tracking-[0.2em] italic uppercase">{cat.name}</span>
                <span className="text-[8px] font-bold opacity-60 tracking-widest uppercase">{cat.words.join(' • ')}</span>
             </div>
             <CheckCircle2 size={16} className="opacity-80" />
          </div>
        ))}
      </div>

      {/* Word Grid */}
      <div className="grid grid-cols-4 gap-2 w-full flex-1 overflow-hidden min-h-0">
        {words.map((word, idx) => {
          const isCompleted = completed.some(cat => cat.words.includes(word));
          if (isCompleted) return null;
          
          const isSelected = selected.includes(word);
          return (
            <button
              key={idx}
              disabled={won || gameOver || !isGameRunning || timeout}
              onClick={() => handleSelect(word)}
              className={`aspect-square sm:aspect-auto sm:h-full rounded-2xl p-2 md:p-3 text-[9px] md:text-[11px] font-black tracking-widest transition-all duration-300 border uppercase
                ${isSelected 
                  ? 'bg-slate-50 text-black border-white shadow-xl scale-[0.98]' 
                  : 'bg-slate-900 border-white/5 text-slate-500 hover:border-slate-500 hover:text-white'}`}
            >
              <div className="text-center hyphens-auto">{word}</div>
            </button>
          );
        })}
      </div>

      {(won || gameOver || timeout) && (
        <div className={`absolute inset-0 z-[60] backdrop-blur-md flex items-center justify-center rounded-3xl animate-in zoom-in duration-300 
          ${won ? 'bg-emerald-950/20' : (timeout ? 'bg-red-950/80' : 'bg-red-950/20')}`}>
           <div className={`bg-[#0a0a1a] border p-10 rounded-[2.5rem] text-center shadow-3xl flex flex-col items-center scale-105 
             ${won ? 'border-emerald-500/20 shadow-emerald-500/10' : 'border-red-500/20 shadow-red-500/10'}`}>
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 border 
                ${won ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                 {won ? <CheckCircle2 className="text-emerald-400" size={40} /> : (timeout ? <AlertTriangle className="text-red-500" size={40} /> : <XCircle className="text-red-400" size={40} />)}
              </div>
              <h3 className={`text-2xl font-black italic tracking-widest uppercase ${won ? 'text-emerald-400' : 'text-red-400'}`}>
                {won ? 'SYNCHRONIZED' : (timeout ? 'SYSTEM TIMEOUT' : 'PROTOCOL NULL')}
              </h3>
              <p className="text-slate-500 text-[10px] mt-4 uppercase tracking-[0.3em] font-bold max-w-[200px] leading-relaxed">
                {won ? `Data categorized. Window sealed.` : (timeout ? 'Access window expired. Sector locked.' : 'System overload. Stability lost.')}
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Grouping_Superstar;
