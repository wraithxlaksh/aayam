import React, { useState, useEffect } from 'react';
import { LayoutGrid, Play, Timer, CheckCircle2, XCircle, Binary, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { name: "SUBATOMIC", words: ["QUARK", "LEPTON", "BOSON", "NEUTRINO"], color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { name: "LAWS", words: ["NEWTON", "KEPLER", "SNELL", "OHM"], color: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
  { name: "CONSTANTS", words: ["PLANCK", "BOLTZMANN", "HUBBLE", "FARADAY"], color: "bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-600/30" },
  { name: "UNITS", words: ["JOULE", "TESLA", "KELVIN", "PASCAL"], color: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" },

  { name: "FORCES", words: ["GRAVITY", "FRICTION", "TENSION", "THRUST"], color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  { name: "ENERGY_TYPES", words: ["KINETIC", "POTENTIAL", "THERMAL", "NUCLEAR"], color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { name: "WAVES", words: ["TRANSVERSE", "LONGITUDINAL", "MECHANICAL", "ELECTROMAGNETIC"], color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  { name: "OPTICS", words: ["REFLECTION", "REFRACTION", "DIFFRACTION", "DISPERSION"], color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },

  { name: "ELECTRIC", words: ["CURRENT", "VOLTAGE", "RESISTANCE", "CAPACITANCE"], color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { name: "MAGNETISM", words: ["FLUX", "FIELD", "DOMAIN", "POLE"], color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  { name: "MOTION", words: ["VELOCITY", "ACCELERATION", "DISPLACEMENT", "SPEED"], color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { name: "ROTATION", words: ["TORQUE", "ANGULAR", "MOMENT", "INERTIA"], color: "bg-indigo-600/20 text-indigo-300 border-indigo-600/30" },

  { name: "ASTRO", words: ["PLANET", "STAR", "GALAXY", "NEBULA"], color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { name: "SPACE", words: ["ORBIT", "GRAVITY", "VACUUM", "COSMOS"], color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { name: "RELATIVITY", words: ["TIME", "SPACE", "LIGHT", "MASS"], color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },

  { name: "THERMO", words: ["ENTROPY", "TEMPERATURE", "HEAT", "WORK"], color: "bg-orange-600/20 text-orange-300 border-orange-600/30" },
  { name: "GAS_LAWS", words: ["PRESSURE", "VOLUME", "TEMPERATURE", "MOLES"], color: "bg-lime-500/20 text-lime-400 border-lime-500/30" },

  { name: "QUANTUM", words: ["PHOTON", "WAVE", "DUALITY", "UNCERTAINTY"], color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30" },
  { name: "NUCLEAR", words: ["FISSION", "FUSION", "DECAY", "RADIATION"], color: "bg-red-600/20 text-red-300 border-red-600/30" },

  { name: "MEASURE", words: ["METER", "SECOND", "AMPERE", "MOLE"], color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { name: "FIELDS", words: ["GRAVITATIONAL", "ELECTRIC", "MAGNETIC", "SCALAR"], color: "bg-indigo-400/20 text-indigo-300 border-indigo-400/30" },

  { name: "LIGHT", words: ["LASER", "PHOTON", "SPECTRUM", "PRISM"], color: "bg-yellow-400/20 text-yellow-300 border-yellow-400/30" },
  { name: "SOUND", words: ["AMPLITUDE", "FREQUENCY", "WAVELENGTH", "PITCH"], color: "bg-pink-400/20 text-pink-300 border-pink-400/30" },

  { name: "FLUIDS", words: ["DENSITY", "PRESSURE", "BUOYANCY", "VISCOSITY"], color: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30" },
  { name: "SOLIDS", words: ["ELASTICITY", "STRAIN", "STRESS", "MODULUS"], color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },

  { name: "EQUATIONS", words: ["FORMULA", "DERIVATION", "VARIABLE", "CONSTANT"], color: "bg-blue-700/20 text-blue-300 border-blue-700/30" },
  { name: "EXPERIMENTS", words: ["DOUBLESLIT", "PHOTOELECTRIC", "CAVENDISH", "MILLKAN"], color: "bg-purple-700/20 text-purple-300 border-purple-700/30" },

  { name: "PARTICLES", words: ["ELECTRON", "PROTON", "NEUTRON", "POSITRON"], color: "bg-cyan-600/20 text-cyan-300 border-cyan-600/30" },
  { name: "CHARGES", words: ["POSITIVE", "NEGATIVE", "NEUTRAL", "ION"], color: "bg-yellow-600/20 text-yellow-300 border-yellow-600/30" },

  { name: "KINEMATICS", words: ["DISTANCE", "SPEED", "TIME", "ACCELERATION"], color: "bg-red-400/20 text-red-300 border-red-400/30" },
  { name: "DYNAMICS", words: ["FORCE", "MASS", "ACCELERATION", "INERTIA"], color: "bg-indigo-700/20 text-indigo-300 border-indigo-700/30" },

  { name: "MODERN", words: ["RELATIVITY", "QUANTUM", "STRING", "COSMOLOGY"], color: "bg-violet-700/20 text-violet-300 border-violet-700/30" },
  { name: "RADIATION", words: ["ALPHA", "BETA", "GAMMA", "XRAYS"], color: "bg-pink-600/20 text-pink-300 border-pink-600/30" },

  { name: "INSTRUMENTS", words: ["MICROSCOPE", "TELESCOPE", "BAROMETER", "THERMOMETER"], color: "bg-green-600/20 text-green-300 border-green-600/30" },
  { name: "CIRCUITS", words: ["SERIES", "PARALLEL", "SWITCH", "BATTERY"], color: "bg-yellow-700/20 text-yellow-300 border-yellow-700/30" },

  { name: "FIELDS_TYPES", words: ["VECTOR", "SCALAR", "UNIFORM", "NONUNIFORM"], color: "bg-indigo-300/20 text-indigo-200 border-indigo-300/30" },
  { name: "WAVE_BEHAVIOR", words: ["REFLECT", "REFRACT", "DIFFRACT", "INTERFERE"], color: "bg-pink-300/20 text-pink-200 border-pink-300/30" },

  { name: "ASTRO_OBJECTS", words: ["BLACKHOLE", "PULSAR", "QUASAR", "SUPERNOVA"], color: "bg-sky-700/20 text-sky-300 border-sky-700/30" },
  { name: "TIME", words: ["SECOND", "MINUTE", "HOUR", "YEAR"], color: "bg-gray-600/20 text-gray-300 border-gray-600/30" }
];

const getRandomCategories = () => {
  return [...CATEGORIES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
};
const Grouping_Superstar = ({ timeLeft, instance, syncScoreToServer, rollNumber, onGameStart }) => {
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeout, setTimeoutState] = useState(false);
  const gameId = `grouping-${instance}`;
  const [activeCategories, setActiveCategories] = useState([]);
 

  // Restore State from Redis
  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/progress/load/${rollNumber}/${gameId}`);
        if (res.ok) {
           const data = await res.json();
           if (data.progress) {
             if (data.progress.words) setWords(data.progress.words);
             if (data.progress.completed) setCompleted(data.progress.completed);
             setMistakes(data.progress.mistakes || 0);
             setWon(data.progress.won || false);
             setGameOver(data.progress.gameOver || false);
             setTimeoutState(data.progress.timeout || false);
           }
        }
      } catch (err) { }
    };
    if (rollNumber) loadState();
  }, [rollNumber, gameId]);

  // Save State to Redis
  useEffect(() => {
    if (!rollNumber || (!completed.length && mistakes === 0 && !won && !gameOver && !timeout)) return;
    const saveState = async () => {
      try {
        await fetch('http://localhost:5000/api/progress/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollNumber, gameId, progress: { words, completed, mistakes, won, gameOver, timeout } })
        });
      } catch (err) {}
    };
    saveState();
  }, [words, completed, mistakes, won, gameOver, timeout, rollNumber, gameId]);

  const handleStart = async () => {
    try {
      await fetch('http://localhost:5000/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, gameType: 'grouping', instance }),
      });
    } catch (err) {}
    if (onGameStart) onGameStart();
  };

  useEffect(() => {
    handleStart();
  }, []);

  const handleSelect = (word) => {
    if (timeLeft <= 0 || won || gameOver || timeout) return;
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
const matchedCategory = activeCategories.find(cat =>
  cat.words.every(w => selectedWords.includes(w))
);    
    if (matchedCategory) {
      const newCompleted = [...completed, matchedCategory];
      setCompleted(newCompleted);
      setSelected([]);
      if (newCompleted.length === 4) {
        setWon(true);
        if (syncScoreToServer) syncScoreToServer('grouping', { mistakes });
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setTimeout(() => {
        setSelected([]);
        if (newMistakes >= 5) {
            setGameOver(true);
            if (syncScoreToServer) syncScoreToServer('grouping', { mistakes: newMistakes });
        }
      }, 500);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 && !won && !gameOver && !timeout && (completed.length > 0 || mistakes > 0)) {
       if (syncScoreToServer) syncScoreToServer('grouping', { mistakes: 5 });
    }
  }, [timeLeft, won, gameOver, timeout, syncScoreToServer]);



useEffect(() => {
  const selected = getRandomCategories();

  setActiveCategories(selected);
  setWords(selected.flatMap(cat => cat.words).sort(() => Math.random() - 0.5));

  setSelected([]);
  setCompleted([]);
  setMistakes(0);
  setWon(false);
  setGameOver(false);
  setTimeoutState(false);
}, [instance]);


  return (
    <div className="w-full text-white font-sans flex flex-col gap-4 items-center h-full overflow-hidden relative select-none">

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
              disabled={won || gameOver || timeout}
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
