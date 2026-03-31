import React, { useState, useEffect } from "react";
import { Terminal, Search, ChevronRight, Timer, Play, ShieldAlert, Binary, AlertTriangle } from "lucide-react";

const CONTEXTO_GRAPH = {
  quantum: { photon: 5, electron: 8, wave: 12, particle: 15, uncertainty: 20, entangle: 3 },
  photon: { light: 2, wave: 6, energy: 10, radiation: 12, quantum: 5 },
  electron: { charge: 3, atom: 6, current: 10, field: 14, quantum: 8 },
  atom: { nucleus: 3, electron: 6, proton: 5, neutron: 5, molecule: 12 },
  nucleus: { proton: 2, neutron: 2, atom: 3, decay: 10, radiation: 12 },
  proton: { nucleus: 2, atom: 5, charge: 4, neutron: 6 },
  neutron: { nucleus: 2, atom: 5, proton: 6, decay: 8 },

  energy: { work: 3, power: 5, heat: 6, kinetic: 4, potential: 4 },
  work: { energy: 3, force: 5, motion: 6 },
  power: { energy: 5, work: 3, current: 10 },

  force: { mass: 5, acceleration: 3, gravity: 4, motion: 6 },
  gravity: { mass: 2, force: 4, orbit: 5, planet: 6 },
  motion: { velocity: 3, acceleration: 2, speed: 3, force: 6 },
  velocity: { speed: 2, motion: 3, acceleration: 4 },
  acceleration: { velocity: 4, motion: 2, force: 3 },

  wave: { frequency: 3, wavelength: 3, amplitude: 4, photon: 6 },
  frequency: { wave: 3, signal: 6, sound: 8 },
  wavelength: { wave: 3, light: 6, spectrum: 8 },
  amplitude: { wave: 4, signal: 5 },

  light: { photon: 2, wave: 6, optics: 5, spectrum: 4 },
  optics: { lens: 3, mirror: 3, light: 5 },
  lens: { optics: 3, focus: 4, image: 5 },
  mirror: { reflection: 2, optics: 3 },
  reflection: { mirror: 2, light: 4 },

  current: { voltage: 3, resistance: 3, circuit: 4, electron: 10 },
  voltage: { current: 3, resistance: 4 },
  resistance: { current: 3, voltage: 4 },
  circuit: { current: 4, battery: 3 },

  battery: { circuit: 3, voltage: 4, energy: 6 },

  heat: { temperature: 2, energy: 6, entropy: 5 },
  temperature: { heat: 2, energy: 6 },
  entropy: { heat: 5, disorder: 3 },

  relativity: { space: 3, time: 3, gravity: 5, einstein: 2 },
  space: { time: 3, universe: 4, dimension: 5 },
  time: { space: 3, relativity: 3, clock: 5 },
  universe: { galaxy: 3, space: 4 },
  galaxy: { star: 3, universe: 3 },
  star: { planet: 3, galaxy: 3 },
  planet: { orbit: 3, star: 3 },
  orbit: { gravity: 5, planet: 3 },

  mass: { force: 5, gravity: 2, inertia: 4 },
  inertia: { mass: 4, motion: 5 },

  sound: { wave: 8, frequency: 8 },
  signal: { wave: 6, amplitude: 5 },

  radiation: { energy: 6, photon: 12, nucleus: 12 },
  decay: { nucleus: 10, radiation: 8 },

  field: { force: 5, electron: 14, charge: 6 },
  charge: { electron: 3, field: 6 },

  equation: { model: 4, theory: 3 },
  theory: { model: 3, equation: 3 },
  model: { theory: 3, equation: 4 },

  dimension: { space: 5, universe: 6 },
  cosmos: { universe: 2, space: 4 },

  einstein: { relativity: 2, gravity: 5 },
  newton: { force: 2, motion: 3 }
};
const ALL_WORDS = Object.keys(CONTEXTO_GRAPH);
const Contexto_Superstar = ({ timeLeft, instance, syncScoreToServer, rollNumber, onGameStart }) => {
const [wordsList, setWordsList] = useState([]);
const [solution, setSolution] = useState('');
 

  
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [won, setWon] = useState(false);
  const [error, setError] = useState('');
  const [timeout, setTimeoutState] = useState(false);

  const gameId = `contexto-${instance}`;

  // Restore State from Redis
  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/progress/load/${rollNumber}/${gameId}`);
        if (res.ok) {
           const data = await res.json();
           if (data.progress) {
             setGuesses(data.progress.guesses || []);
             setWon(data.progress.won || false);
             setTimeoutState(data.progress.timeout || false);
              setWordsList(data.progress.wordsList);
  setSolution(data.progress.wordsList[0]);
           }
        }
      } catch (err) { }
    };
    if (rollNumber) loadState();
  }, [rollNumber, gameId]);

  // Save State to Redis
  useEffect(() => {
    if (!rollNumber || (!guesses.length && !won && !timeout)) return;
    const saveState = async () => {
      try {
        await fetch('http://localhost:5000/api/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollNumber, gameId, progress: { guesses, won, timeout } })
        });
      } catch (err) {}
    };
    saveState();
  }, [guesses, won, timeout, rollNumber, gameId]);

  const handleStart = async () => {
    try {
      await fetch('http://localhost:5000/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
  rollNumber, 
  gameId, 
  progress: { guesses, won, timeout, wordsList } 
})
      });
    } catch (err) {}
    if (onGameStart) onGameStart();
  };

  useEffect(() => {
    handleStart();
  }, []);

  
  useEffect(() => {
  const randomWord = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
  setSolution(randomWord);

  setGuesses([]);
  setWon(false);
  setTimeoutState(false);
}, [instance]);
const getRank = (guess) => {
  const g = guess.toLowerCase().trim();
  const target = solution;

  if (g === target) return 1;

  // direct relation
  if (CONTEXTO_GRAPH[target]?.[g]) {
    return CONTEXTO_GRAPH[target][g];
  }

  // reverse relation
  if (CONTEXTO_GRAPH[g]?.[target]) {
    return CONTEXTO_GRAPH[g][target] + 10;
  }

  // indirect relation (shared neighbors)
  const targetNeighbors = CONTEXTO_GRAPH[target] || {};
  const guessNeighbors = CONTEXTO_GRAPH[g] || {};

  const common = Object.keys(targetNeighbors).filter(w => guessNeighbors[w]);

  if (common.length > 0) {
    return 20 + common.length * 10;
  }

  return 3000 + Math.floor(Math.random() * 2000);
};

  const handleGuess = async (e) => {
    e.preventDefault();
    if (timeLeft <= 0 || won || timeout) return;
    
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
      if (syncScoreToServer) syncScoreToServer('contexto', { rank: 1 });
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 && !won && !timeout && guesses.length > 0) {
       const bestRank = Math.min(...guesses.map(g => g.rank));
       if (syncScoreToServer) syncScoreToServer('contexto', { rank: bestRank });
    }
  }, [timeLeft, won, timeout, guesses, syncScoreToServer]);

  const formatSecs = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-full text-white font-sans flex flex-col gap-4 items-center h-full overflow-hidden relative select-none">

      {/* Game Header */}
      <div className="flex justify-between items-center w-full px-2 shrink-0">
        <div className="flex flex-col">
           <h2 className="text-lg font-black italic tracking-widest text-indigo-400 uppercase leading-none">TERMINAL {instance}</h2>
           <span className={`text-[7px] font-bold uppercase tracking-widest mt-1 ${won ? 'text-emerald-500' : (timeout ? 'text-red-500' : 'text-slate-600')}`}>
             Status: {won ? 'CAPTURED' : (timeout ? 'HALTED' : (timeLeft > 0 ? 'ACTIVE' : 'STANDBY'))}
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
            disabled={won || timeLeft <= 0 || timeout || wordsList?.length === 0}
            placeholder={won ? "Mission Completed" : (timeout ? "Terminal Locked" : "Enter keyword...")}
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-5 pr-14 text-sm font-medium focus:border-indigo-500/50 outline-none transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={won || timeLeft <= 0 || timeout}
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
