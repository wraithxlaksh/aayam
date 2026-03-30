import React, { useState, useEffect } from "react";
import { Terminal, Search, ChevronRight, Timer, Play, ShieldAlert, Binary, AlertTriangle } from "lucide-react";

const PHYSICS_GROUPS = {
  LEVEL_1: ['atom', 'quark', 'photon', 'electron', 'proton', 'neutron', 'boson', 'lepton', 'neutrino', 'muon'],
  LEVEL_2: ['energy', 'force', 'mass', 'speed', 'velocity', 'acceleration', 'momentum', 'power', 'work', 'heat'],
  LEVEL_3: ['gravity', 'magnetism', 'electric', 'static', 'dynamic', 'plasma', 'solid', 'liquid', 'gas', 'fluid'],
  LEVEL_4: ['wave', 'particle', 'dual', 'spin', 'charge', 'field', 'space', 'time', 'relative', 'absolute'],
};

const SOLUTIONS = ['entanglement', 'relativity'];

const Contexto_Superstar = ({ timeLeft, instance, syncScoreToServer, rollNumber, gameCountdown, isGameRunning, startInstanceTimer, stopInstanceTimer }) => {
  const solution = SOLUTIONS[(instance - 1) % SOLUTIONS.length];
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [won, setWon] = useState(false);
  const [error, setError] = useState('');
  const [timeout, setTimeoutState] = useState(false);

  // Monitor Countdown for Timeout
  useEffect(() => {
    if (isGameRunning && gameCountdown <= 0 && !won) {
      setTimeoutState(true);
      stopInstanceTimer();
    }
  }, [gameCountdown, isGameRunning, won]);

  const handleStart = async () => {
    if (timeout) return;
    try {
      await fetch('http://localhost:5000/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, gameType: 'contexto', instance }),
      });
    } catch (err) {}
    startInstanceTimer();
  };

  const getRank = (word) => {
    const w = word.toLowerCase().trim();
    if (w === solution) return 1;
    if (PHYSICS_GROUPS.LEVEL_1.includes(w)) return Math.floor(Math.random() * 5) + 2;
    if (PHYSICS_GROUPS.LEVEL_2.includes(w)) return Math.floor(Math.random() * 50) + 10;
    if (PHYSICS_GROUPS.LEVEL_3.includes(w)) return Math.floor(Math.random() * 200) + 100;
    if (PHYSICS_GROUPS.LEVEL_4.includes(w)) return Math.floor(Math.random() * 500) + 500;
    return Math.floor(Math.random() * 5000) + 1000;
  };

  const handleGuess = async (e) => {
    e.preventDefault();
    if (timeLeft <= 0 || won || !isGameRunning || timeout) return;
    
    const w = guess.toLowerCase().trim();
    if (!w) return;

    if (guesses.find(g => g.word === w)) {
      setError('Already guessed!');
      setTimeout(() => setError(''), 2000);
      setGuess('');
      return;
    }

    const rank = getRank(w);
    const newGuess = { word: w, rank };
    const updatedGuesses = [newGuess, ...guesses].sort((a, b) => a.rank - b.rank);
    setGuesses(updatedGuesses);
    setGuess('');

    if (rank === 1) {
      setWon(true);
      stopInstanceTimer();
      try {
        await fetch('http://localhost:5000/api/game/end', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ rollNumber, gameType: 'contexto', instance, baseScore: 100 }),
        });
      } catch (err) {
        if (syncScoreToServer) syncScoreToServer(100);
      }
    }
  };

  const formatSecs = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-full text-white font-sans flex flex-col gap-4 items-center h-full overflow-hidden relative select-none">
      
      {!isGameRunning && !timeout && !won && (
        <div className="absolute inset-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 rounded-3xl animate-in fade-in duration-300">
           <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/10">
              <Terminal className="text-indigo-400" size={40} />
           </div>
           <h3 className="text-2xl font-black italic tracking-widest text-white mb-2 uppercase">TERMINAL SYNC {instance}</h3>
           <p className="text-slate-500 text-[10px] text-center max-w-[240px] leading-relaxed uppercase tracking-[0.3em] font-bold mb-10">
              3-Minute Quantum Window Detected. Initialize connection?
           </p>
           <button 
             onClick={handleStart}
             className="group bg-white text-black px-12 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-white/10 active:scale-95"
           >
              <Play size={16} fill="currentColor" /> START
           </button>
        </div>
      )}

      {/* Game Header */}
      <div className="flex justify-between items-center w-full px-2 shrink-0">
        <div className="flex flex-col">
           <h2 className="text-lg font-black italic tracking-widest text-indigo-400 uppercase leading-none">TERMINAL {instance}</h2>
           <span className={`text-[7px] font-bold uppercase tracking-widest mt-1 ${won ? 'text-emerald-500' : (timeout ? 'text-red-500' : 'text-slate-600')}`}>
             Status: {won ? 'CAPTURED' : (timeout ? 'HALTED' : (isGameRunning ? 'ACTIVE' : 'STANDBY'))}
           </span>
        </div>
      </div>

      {/* Guess Input */}
      <form onSubmit={handleGuess} className="w-full max-w-sm flex flex-col gap-2 shrink-0 relative">
        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-2">Semantic Probe</label>
        <div className="relative group">
          <input 
            type="text" 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={won || timeLeft <= 0 || !isGameRunning || timeout}
            placeholder={won ? "Mission Completed" : (timeout ? "Terminal Locked" : "Enter keyword...")}
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-5 pr-14 text-sm font-medium focus:border-indigo-500/50 outline-none transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={won || timeLeft <= 0 || !isGameRunning || timeout}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 p-2 rounded-xl hover:bg-indigo-500 transition-all text-white disabled:opacity-20"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {error && <span className="text-[8px] text-red-500 font-bold uppercase tracking-widest pl-2 animate-pulse">{error}</span>}
      </form>

      {/* Results List */}
      <div className="w-full flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scroll-smooth min-h-0">
        {guesses.map((g, idx) => (
          <div key={idx} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all animate-in slide-in-from-left duration-500
            ${g.rank === 1 ? 'bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-slate-900/40 border-white/5'}`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-widest ${g.rank === 1 ? 'text-emerald-400' : 'text-slate-300'}`}>{g.word}</span>
              <span className="text-[7px] text-slate-600 font-bold uppercase mt-0.5">Vector Match</span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-xs font-black italic tabular-nums tracking-tighter ${g.rank === 1 ? 'text-emerald-400' : 'text-indigo-400'}`}>Rank {g.rank}</span>
            </div>
          </div>
        ))}
      </div>

      {timeout && !won && (
        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md z-[60] flex items-center justify-center rounded-3xl animate-in zoom-in duration-300">
           <div className="bg-[#1a0505] border border-red-500/20 p-10 rounded-[2.5rem] text-center shadow-3xl shadow-red-500/10 flex flex-col items-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-[2rem] flex items-center justify-center mb-6 border border-red-500/30">
                 <AlertTriangle className="text-red-500" size={40} />
              </div>
              <h3 className="text-2xl font-black text-red-500 italic tracking-[0.2em] uppercase">SYSTEM TIMEOUT</h3>
              <p className="text-slate-400 text-[10px] mt-4 uppercase tracking-[0.3em] font-bold max-w-[200px] leading-relaxed">3-Minute quantum window expired. Connection severed.</p>
              <button onClick={() => window.location.reload()} className="mt-10 text-white/40 text-[8px] font-bold uppercase tracking-[0.5em] hover:text-white transition-colors">INITIALIZE REBOOT</button>
           </div>
        </div>
      )}

      {won && (
        <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-md z-40 flex items-center justify-center rounded-3xl animate-in zoom-in duration-500">
           <div className="bg-[#051a05] border border-emerald-500/20 p-10 rounded-[2.5rem] text-center shadow-3xl shadow-emerald-500/10 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
                 <ShieldAlert className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-xl font-black text-emerald-400 italic tracking-widest uppercase">Target Sync Complete</h3>
              <p className="text-slate-400 text-[9px] mt-2 uppercase tracking-widest font-bold">Quantum decryption successful.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Contexto_Superstar;
