import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = [
  {
    name: "SUBATOMIC PARTICLES",
    words: ["QUARK", "LEPTON", "BOSON", "NEUTRINO"],
    color: "bg-cyan-500",
    description: "The fundamental building blocks of matter."
  },
  {
    name: "SCIENTIFIC LAWS",
    words: ["NEWTON", "KEPLER", "SNELL", "OHM"],
    color: "bg-blue-600",
    description: "Fundamental principles governing classical physics."
  },
  {
    name: "PHYSICAL CONSTANTS",
    words: ["PLANCK", "BOLTZMANN", "HUBBLE", "FARADAY"],
    color: "bg-fuchsia-600",
    description: "Invariant values that define our universe."
  },
  {
    name: "SI UNITS",
    words: ["JOULE", "TESLA", "KELVIN", "PASCAL"],
    color: "bg-emerald-600",
    description: "Standard units of measurement in physics."
  }
];

const INITIAL_WORDS = CATEGORIES.flatMap(cat => cat.words);

const Grouping_Superstar = ({ onBack }) => {
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isActive, setIsActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shaking, setShaking] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    shuffleWords();
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleGameOver(false);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  const shuffleWords = () => {
    const shuffled = [...INITIAL_WORDS].sort(() => Math.random() - 0.5);
    setWords(shuffled);
  };

  const startGame = () => {
    setIsActive(true);
    setGameOver(false);
    setWon(false);
    setMistakes(0);
    setTimeLeft(180);
    setCompleted([]);
    setSelected([]);
    shuffleWords();
  };

  const handleGameOver = (success) => {
    setIsActive(false);
    setGameOver(true);
    setWon(success);
    clearInterval(timerRef.current);
  };

  const handleSelect = (word) => {
    if (!isActive || gameOver || completed.some(cat => cat.words.includes(word))) return;

    if (selected.includes(word)) {
      setSelected(selected.filter(w => w !== word));
    } else {
      if (selected.length < 4) {
        const nextSelected = [...selected, word];
        setSelected(nextSelected);
        if (nextSelected.length === 4) {
          checkGroup(nextSelected);
        }
      }
    }
  };

  const checkGroup = (selectedWords) => {
    const matchedCategory = CATEGORIES.find(cat => 
      cat.words.every(w => selectedWords.includes(w))
    );

    if (matchedCategory) {
      setTimeout(() => {
        const newCompleted = [...completed, matchedCategory];
        setCompleted(newCompleted);
        setSelected([]);
        if (newCompleted.length === 4) {
          handleGameOver(true);
        }
      }, 300);
    } else {
      setShaking(true);
      setMistakes(prev => prev + 1);
      setTimeout(() => {
        setShaking(false);
        setSelected([]);
        if (mistakes + 1 >= 5) {
          handleGameOver(false);
        }
      }, 500);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Menu
        </button>
        <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
          PHYSICS GROUPING
        </h1>
        <div className="flex flex-col items-end">
          <div className={`text-2xl font-mono ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">
            Mistakes: <span className={mistakes >= 4 ? 'text-red-500' : 'text-slate-300'}>{mistakes}/5</span>
          </div>
        </div>
      </div>

      {!isActive && !gameOver && !won ? (
        <div className="flex flex-col items-center justify-center flex-1 space-y-8">
          <div className="text-center max-w-lg">
            <p className="text-xl text-gray-300 leading-relaxed">
              Find groups of four words that share a <span className="text-blue-400 font-bold">Physics Context</span>.
              Careful: you only have 5 attempts.
            </p>
          </div>
          <button 
            onClick={startGame}
            className="px-12 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            START EXPERIMENT
          </button>
        </div>
      ) : (
        <div className="w-full max-w-2xl flex flex-col gap-8">
          {/* Completed Categories */}
          <div className="flex flex-col gap-3">
            {completed.map((cat, i) => (
              <div 
                key={i} 
                className={`${cat.color} p-4 rounded-xl text-center animate-in slide-in-from-top duration-500`}
              >
                <h3 className="text-lg font-black tracking-widest text-white/90 mb-1">{cat.name}</h3>
                <p className="text-sm font-medium text-white/70 uppercase">
                  {cat.words.join(', ')}
                </p>
              </div>
            ))}
          </div>

          {/* Word Grid */}
          {!won && !gameOver && (
            <div className={`grid grid-cols-4 gap-3 ${shaking ? 'animate-shake' : ''}`}>
              {words.filter(w => !completed.some(c => c.words.includes(w))).map((word, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(word)}
                  className={`aspect-square sm:aspect-video flex items-center justify-center p-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 uppercase tracking-tighter
                    ${selected.includes(word) 
                      ? 'bg-slate-100 text-[#0a0a0f] border-2 border-white scale-95' 
                      : 'bg-[#161625] text-gray-400 border-2 border-slate-800 hover:border-slate-500 hover:text-white'}`}
                >
                  {word}
                </button>
              ))}
            </div>
          )}

          {/* Win/Loss Screen */}
          {(won || gameOver) && (
            <div className={`p-8 rounded-2xl text-center border animate-in zoom-in duration-500
              ${won ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
              <h2 className={`text-3xl font-black mb-4 ${won ? 'text-green-400' : 'text-red-400'}`}>
                {won ? 'EUREKA! EXPERIMENT SUCCESS' : 'SYSTEM CRITICAL FAILURE'}
              </h2>
              <p className="text-gray-300 mb-6 font-medium">
                {won ? 'All physics groups identified correctly.' : 'Mistakes exceeded or safety protocol timed out.'}
              </p>
              <button 
                onClick={startGame}
                className={`px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 text-white
                ${won ? 'bg-green-600' : 'bg-red-600'}`}
              >
                RESTART EXPERIMENT
              </button>
            </div>
          )}

          {/* Remaining Attempts Visualization */}
          {!won && !gameOver && (
            <div className="flex justify-center items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${i < mistakes ? 'bg-red-500 border border-red-400 shadow-[0_0_10px_red]' : 'bg-slate-700'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Grouping_Superstar;
