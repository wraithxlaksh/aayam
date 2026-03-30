import React, { useState, useEffect } from "react";
import { BrainCircuit, Crosshair, Trophy, Timer, LayoutGrid, Terminal, Type, LogOut, Binary, Menu, X } from "lucide-react";
import Contexto_Superstar from "./Contexto_Superstar";
import Grouping_Superstar from "./Grouping_Superstar";
import Wordle_Superstar from "./Wordle_Superstar";

export default function AayamScreen({ activeMode, setActiveMode, activeGame, setActiveGame, activeInstance, setActiveInstance, timeLeft, setTimeLeft, timerActive, player, onLogout, onGameStart }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  // PER-GAME TIMERS: State for tracking each instance's 3-minute window
  const [gameTimers, setGameTimers] = useState({}); // { 'contexto-1': 180, ... }
  const [runningTimers, setRunningTimers] = useState(new Set());

  // LEADERBOARD & TICKER
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/leaderboard');
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
        }
      } catch (err) {
        console.warn("Leaderboard sync failed (Backend Offline)");
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  // Per-game Timer Tick Logic
  useEffect(() => {
    let interval = setInterval(() => {
      setGameTimers(prev => {
        const next = { ...prev };
        let changed = false;
        runningTimers.forEach(id => {
          if (next[id] > 0) {
            next[id] -= 1;
            changed = true;
          } else if (next[id] === 0) {
            // Trigger auto-stop handled in component, or we can remove from set
            runningTimers.delete(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimers]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const syncScoreToServer = async (scoreChange) => {
    if (!player) return;
    try {
      await fetch('http://localhost:5000/api/score/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: player.rollNumber, scoreChange }),
      });
    } catch (err) { }
  };

  const startInstanceTimer = (id) => {
    setGameTimers(prev => ({ ...prev, [id]: 180 }));
    setRunningTimers(prev => new Set(prev).add(id));
    if (onGameStart) onGameStart();
  };

  const stopInstanceTimer = (id) => {
    setRunningTimers(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const activeTimerId = `${activeGame}-${activeInstance}`;
  const gameProps = { 
    timeLeft, 
    setTimeLeft, 
    timerActive, 
    rollNumber: player?.rollNumber, 
    syncScoreToServer, 
    gameCountdown: gameTimers[activeTimerId] ?? 180,
    isGameRunning: runningTimers.has(activeTimerId),
    startInstanceTimer: () => startInstanceTimer(activeTimerId),
    stopInstanceTimer: () => stopInstanceTimer(activeTimerId)
  };

  return (
    <div className="h-screen w-screen bg-[#050510] text-slate-200 flex overflow-hidden font-sans select-none relative">
      
      {/* LEFT SIDEBAR: MODE SELECTOR & TIMER (Collapses on Mobile) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 bg-[#08081a] transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-indigo-600/20' : '-translate-x-full'}`}>
        <div className="px-6 py-6 flex justify-between items-center group">
          <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase italic transition-colors hover:text-white">AAYAM v1.2</h2>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 p-1"><X size={16} /></button>
        </div>

        {/* SITE-LEFT GAME TIMER (3-MINUTE COUNTDOWN) */}
        <div className="mb-2 px-6 py-8 bg-gradient-to-br from-red-600/10 to-transparent border-b border-white/5 flex flex-col items-center justify-center relative">
            <div className="flex items-center gap-2 text-red-500/80 text-[8px] font-black tracking-[0.4em] uppercase mb-1">
               <Timer size={10} />
               <span>PROTOCOL CLOCK</span>
            </div>
            <div className={`text-6xl font-black italic tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all ${gameTimers[activeTimerId] < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
               {formatTime(gameTimers[activeTimerId] ?? 180)}
            </div>
            <div className="text-[7px] text-slate-700 font-bold uppercase tracking-[0.2em] mt-1">{activeGame}:{activeInstance} WINDOW</div>
            <div className="absolute bottom-0 left-0 h-0.5 bg-red-500 transition-all duration-1000 opacity-20" style={{ width: `${((gameTimers[activeTimerId] ?? 180) / 180) * 100}%` }}></div>
        </div>

        {/* MISSION TIMER (GLOBAL 10 MIN) */}
        <div className="mb-6 px-6 py-4 flex flex-col items-center border-b border-white/5 opacity-50">
            <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">GLOBAL SESSION</div>
            <div className="text-xl font-black italic tabular-nums text-indigo-400">
               {formatTime(timeLeft)}
            </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          <button 
            onClick={() => { setActiveMode('triple-threat'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all group ${activeMode === 'triple-threat' ? 'bg-indigo-600 shadow-lg text-white' : 'hover:bg-white/5 text-slate-500 font-medium'}`}
          >
            <Crosshair size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Triple Threat</span>
          </button>
          <button 
            onClick={() => { setActiveMode('mind-sync'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all group ${activeMode === 'mind-sync' ? 'bg-fuchsia-600 shadow-lg text-white' : 'hover:bg-white/5 text-slate-500 font-medium'}`}
          >
            <BrainCircuit size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Mind Sync</span>
          </button>
        </nav>

        <div className="p-4 flex flex-col items-center gap-1.5 opacity-30 mt-auto border-t border-white/5">
           <button onClick={onLogout} className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-red-500 transition-colors py-2 uppercase tracking-widest"><LogOut size={12} /> Abort Mission</button>
        </div>
      </aside>

      {/* CENTER SECTION: GAME AREA */}
      <main className="flex-1 flex flex-col bg-[#02020a] relative overflow-hidden h-full min-w-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40"></div>

        <header className="h-14 border-b border-white/5 px-4 md:px-6 flex items-center justify-between z-10 bg-[#02020a]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-indigo-400 p-1"><Menu size={20} /></button>
             <span className="text-[10px] font-black italic tracking-tighter text-indigo-400 hidden sm:inline">SECURE_LINK</span>
             <span className="text-slate-800 text-[10px] hidden sm:inline">/</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[100px]">{activeMode.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end pr-2 border-r border-white/5 mr-1">
                <span className="text-[9px] font-black text-white tracking-widest uppercase truncate max-w-[120px]">{player?.name || "GUEST"}</span>
                <span className="text-[8px] font-bold text-slate-600 tracking-tighter uppercase">{player?.rollNumber || "ID: UNKNOWN"}</span>
             </div>
             <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black border border-white/10 ring-4 ring-indigo-500/10 shadow-lg">{(player?.name?.[0] || 'S').toUpperCase()}</div>
             <button onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)} className="lg:hidden text-amber-500 p-1 border-l border-white/5 pl-2"><Trophy size={18} /></button>
          </div>
        </header>

        {activeMode === 'triple-threat' && (
          <div className="px-4 md:px-6 pt-4 md:pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 z-10 shrink-0">
            <div className="flex flex-wrap justify-center gap-2 bg-[#08081a] p-1 rounded-xl border border-white/5">
              {['contexto', 'grouping', 'wordle'].map(game => (
                <button 
                  key={game}
                  onClick={() => setActiveGame(game)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black flex items-center gap-2 transition-all ${activeGame === game ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'}`}
                >
                  {game === 'contexto' && <Terminal size={12} />}
                  {game === 'grouping' && <LayoutGrid size={12} />}
                  {game === 'wordle' && <Type size={12} />}
                  {game.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-slate-950 border border-white/5 p-1 rounded-xl">
              {[1, 2].map(num => (
                <button 
                  key={num}
                  onClick={() => setActiveInstance(num)}
                  className={`w-8 h-6 rounded-md text-[9px] font-black transition-all ${activeInstance === num ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-700 hover:text-slate-300'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MAIN GAMEPLAY CONTAINER */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-4 md:pb-8 z-10 w-full overflow-hidden">
          <div className="w-full max-w-2xl bg-[#0a0a1a]/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-4 md:p-8 shadow-2xl relative flex flex-col justify-start h-auto max-h-full overflow-hidden self-center border-t-indigo-500/15">
             <div className="w-full h-full flex flex-col overflow-hidden">
                {activeMode === 'triple-threat' ? (
                   <>
                      <div className={activeGame === 'contexto' ? 'w-full h-full' : 'hidden'}>
                        <div className={activeInstance === 1 ? 'w-full h-full' : 'hidden'}><Contexto_Superstar {...gameProps} instance={1} /></div>
                        <div className={activeInstance === 2 ? 'w-full h-full' : 'hidden'}><Contexto_Superstar {...gameProps} instance={2} /></div>
                      </div>
                      <div className={activeGame === 'grouping' ? 'w-full h-full' : 'hidden'}>
                        <div className={activeInstance === 1 ? 'w-full h-full' : 'hidden'}><Grouping_Superstar {...gameProps} instance={1} /></div>
                        <div className={activeInstance === 2 ? 'w-full h-full' : 'hidden'}><Grouping_Superstar {...gameProps} instance={2} /></div>
                      </div>
                      <div className={activeGame === 'wordle' ? 'w-full h-full' : 'hidden'}>
                        <div className={activeInstance === 1 ? 'w-full h-full' : 'hidden'}><Wordle_Superstar {...gameProps} instance={1} /></div>
                        <div className={activeInstance === 2 ? 'w-full h-full' : 'hidden'}><Wordle_Superstar {...gameProps} instance={2} /></div>
                      </div>
                   </>
                ) : (
                   <div className="py-12 md:py-20 text-center flex flex-col justify-center items-center">
                      <div className="w-16 h-16 rounded-3xl bg-fuchsia-600/10 border border-fuchsia-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-fuchsia-600/5">
                         <BrainCircuit size={40} className="text-fuchsia-500 opacity-50 animate-pulse" />
                      </div>
                      <h2 className="text-xl font-black italic tracking-widest text-white uppercase italic">MIND SYNC</h2>
                      <p className="text-slate-600 text-[9px] mt-2 uppercase tracking-[0.4em] font-medium italic">Protocol Pending Initialization</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: LEADERBOARD (Drawer on Mobile) */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 lg:relative lg:translate-x-0 border-l border-white/5 bg-[#08081a] p-6 transform transition-transform duration-300 flex flex-col ${isLeaderboardOpen ? 'translate-x-0 shadow-2xl shadow-amber-600/10' : 'translate-x-full lg:translate-x-0'}`}>
        <header className="mb-8 flex items-center justify-between px-2 text-slate-400">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={16} />
            <h2 className="text-xs font-black italic tracking-tighter uppercase italic">LIVE_RANKINGS</h2>
          </div>
          <button onClick={() => setIsLeaderboardOpen(false)} className="lg:hidden text-slate-500 p-1"><X size={16} /></button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          {leaderboard.map((entry, idx) => (
            <div key={idx} className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${idx === 0 ? 'bg-amber-500/5 border-amber-500/20 shadow-lg' : entry.rollNumber === player?.rollNumber ? 'bg-indigo-600/5 border-indigo-500/20 shadow-lg' : 'bg-white/2 border-transparent'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-black ${idx === 0 ? 'bg-amber-500 text-black shadow-lg' : 'bg-slate-900 border border-white/5 text-slate-500'}`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] font-black truncate tracking-tight ${idx === 0 ? 'text-amber-400' : 'text-slate-300'}`}>{entry.name}</span>
                  <span className="text-[10px] font-black text-indigo-400">{entry.score}</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${idx === 0 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-indigo-500/50'}`} style={{ width: `${Math.min(100, (entry.score / 2000) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6 px-1">
           <div className={`bg-gradient-to-br p-4 rounded-3xl border relative overflow-hidden ${player ? 'from-indigo-900/40 to-transparent border-indigo-500/30' : 'from-slate-900 to-transparent border-white/5'}`}>
              <div className="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-widest leading-none">YOUR POSITION</div>
              <div className="text-3xl font-black text-white italic tracking-tighter">
                 {leaderboard.findIndex(p => p.rollNumber === player?.rollNumber) + 1 || "..."}
              </div>
              <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12"><Binary size={48} /></div>
           </div>
        </div>
      </aside>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
      `}</style>

    </div>
  );
}