import React, { useState, useEffect, useRef } from 'react';

const PHYSICS_GROUPS = {
  TARGET: ['entanglement'],
  LEVEL_1: ['superposition', 'quantum', 'qubit', 'spooky', 'epr', 'schrodinger', 'wavefunction', 'decoherence'],
  LEVEL_2: ['physics', 'particle', 'atom', 'photon', 'electron', 'neutron', 'proton', 'matter', 'field', 'energy'],
  LEVEL_3: ['gravity', 'relativity', 'entropy', 'thermodynamics', 'velocity', 'force', 'mass', 'acceleration', 'wavelength', 'spectrum'],
  LEVEL_4: ['science', 'experiment', 'lab', 'hypothesis', 'data', 'theory', 'mathematics', 'calculation', 'observation']
};

const Contexto_Superstar = ({ onBack }) => {
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [isActive, setIsActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState('');
  const [won, setWon] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameOver(true);
      setIsActive(false);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  const startGame = () => {
    setIsActive(true);
    setGameOver(false);
    setWon(false);
    setTimeLeft(180);
    setGuesses([]);
    setError('');
  };

  const getRank = (word) => {
    const w = word.toLowerCase().trim();
    if (PHYSICS_GROUPS.TARGET.includes(w)) return 1;
    if (PHYSICS_GROUPS.LEVEL_1.includes(w)) return Math.floor(Math.random() * 5) + 2;
    if (PHYSICS_GROUPS.LEVEL_2.includes(w)) return Math.floor(Math.random() * 50) + 10;
    if (PHYSICS_GROUPS.LEVEL_3.includes(w)) return Math.floor(Math.random() * 200) + 100;
    if (PHYSICS_GROUPS.LEVEL_4.includes(w)) return Math.floor(Math.random() * 500) + 500;
    return Math.floor(Math.random() * 5000) + 1000;
  };

  const isGibberish = (word) => {
    const w = word.toLowerCase().trim();
    if (w.length < 2) return true;
    const vowels = w.match(/[aeiou]/gi);
    if (!vowels && w.length > 2) return true;
    const consonantClusters = w.match(/[^aeiou]{4,}/gi);
    if (consonantClusters) return true;
    return false;
  };

  const handleGuess = (e) => {
    e.preventDefault();
    if (!isActive || gameOver) return;
    
    const w = guess.toLowerCase().trim();
    if (!w) return;

    if (isGibberish(w)) {
      setError('Invalid word: Please enter a real physics term.');
      setTimeout(() => setError(''), 3000);
      setGuess('');
      return;
    }

    if (guesses.find(g => g.word === w)) {
      setError('Word already guessed!');
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
      setIsActive(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Menu
        </button>
        <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
          CONTEXTO: PHYSICS EDITION
        </h1>
        <div className={`text-2xl font-mono ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {!isActive && !gameOver && !won ? (
        <div className="flex flex-col items-center justify-center flex-1 space-y-8">
          <div className="text-center max-w-lg">
            <p className="text-xl text-gray-300 leading-relaxed shadow-cyan-900/20">
              Guess the secret <span className="text-cyan-400 font-bold">Physics term</span>. 
              The closer your guess is to the secret word, the lower the rank.
            </p>
          </div>
          <button 
            onClick={startGame}
            className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            START GAME
          </button>
        </div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {/* Input Area */}
          <form onSubmit={handleGuess} className="relative">
            <input 
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={gameOver || won}
              placeholder="Type your guess..."
              className="w-full bg-[#161625] border-2 border-slate-800 rounded-xl px-6 py-4 text-xl outline-none focus:border-cyan-500 transition-all placeholder:text-gray-600"
            />
            <button 
              type="submit"
              disabled={gameOver || won}
              className="absolute right-3 top-3 bottom-3 px-6 bg-cyan-600 rounded-lg font-bold hover:bg-cyan-500 disabled:opacity-50 transition-colors"
            >
              GUESS
            </button>
            {error && <div className="absolute -bottom-6 left-0 text-red-400 text-sm animate-bounce">{error}</div>}
          </form>

          {/* Winning/Losing State */}
          {won && (
            <div className="p-8 bg-green-900/30 border border-green-500/50 rounded-2xl text-center animate-in fade-in zoom-in duration-500">
              <h2 className="text-3xl font-black text-green-400 mb-2">UNLOCKED: ENTANGLEMENT</h2>
              <p className="text-green-200">Quantum discovery achieved! You found the secret word.</p>
              <button 
                onClick={startGame}
                className="mt-6 px-8 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold transition-colors"
              >
                Dobara Khelna Hai ?
              </button>
            </div>
          )}

          {gameOver && !won && (
            <div className="p-8 bg-red-900/30 border border-red-500/50 rounded-2xl text-center animate-in fade-in zoom-in duration-500">
              <h2 className="text-3xl font-black text-red-400 mb-2">SYSTEM FAILURE</h2>
              <p className="text-red-200">Time has expanded beyond your control. The word was <span className="font-bold underline text-white">ENTANGLEMENT</span>.</p>
              <button 
                onClick={startGame}
                className="mt-6 px-8 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Guesses List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {guesses.map((g, i) => (
              <div 
                key={i}
                className={`flex justify-between items-center p-4 rounded-xl border transition-all animate-in slide-in-from-top-2 duration-300
                  ${g.rank === 1 ? 'bg-green-600/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 
                    g.rank < 100 ? 'bg-cyan-600/10 border-cyan-800' : 'bg-slate-900/50 border-slate-800'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-mono text-sm w-4">{guesses.length - i}</span>
                  <span className={`text-xl font-medium capitalize ${g.rank < 100 ? 'text-cyan-300' : 'text-gray-300'}`}>
                    {g.word}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className={`h-full transition-all duration-1000 ${g.rank < 100 ? 'bg-cyan-500' : 'bg-slate-600'}`}
                      style={{ width: `${Math.max(0, 100 - (g.rank / 50))} %` }}
                    ></div>
                  </div>
                  <span className={`text-lg font-bold w-12 text-right ${g.rank < 100 ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {g.rank}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Styles for scrollbar */}
      <style >{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default Contexto_Superstar;
