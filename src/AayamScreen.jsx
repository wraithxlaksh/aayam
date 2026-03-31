import React, { useState, useEffect } from "react";
import { BrainCircuit, Crosshair, Trophy, Timer, LayoutGrid, Terminal, Type, LogOut, Binary, Menu, X } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import Contexto_Superstar from "./Contexto_Superstar";
import Grouping_Superstar from "./Grouping_Superstar";
import Wordle_Superstar from "./Wordle_Superstar";

export default function AayamScreen({ 
  activeMode, setActiveMode, 
  activeGame, setActiveGame, 
  activeInstance, setActiveInstance,
  timeLeft, setTimeLeft, timerActive, player, onLogout, onGameStart 
}) {
  const { id: roundId } = useParams();
  const navigate = useNavigate();
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  const [isLive, setIsLive] = useState(true); // default true for round
  const [isQualified, setIsQualified] = useState(false);

  // LEADERBOARD & SSE LIVE STATE
  useEffect(() => {
    if (!roundId) return;
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/api/events/${roundId}`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'STATE_UPDATE') {
        setIsLive(data.payload.isLive);
      } else if (data.type === 'ROUND_START') {
        // Handle global start event if needed
        const roundData = data.payload;
        if (roundData.status === 'LIVE') {
           const timeRemaining = Math.max(0, Math.floor((roundData.end_time - Date.now()) / 1000));
           setTimeLeft(timeRemaining);
           setIsLive(true);
        } else {
           setIsLive(false);
        }
      } else if (data.type === 'LEADERBOARD') {
        setLeaderboard(data.payload);
        const myRank = data.payload.find(p => p.rollNumber === player?.rollNumber);
        if (myRank) {
           setIsQualified(myRank.is_qualified);
        }
      }
    };
    return () => eventSource.close();
  }, [player, roundId, setTimeLeft]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval = null;
    if (isLive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
           if (prev <= 1) {
              clearInterval(interval);
              setIsLive(false);
              return 0;
           }
           return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive, timeLeft, setTimeLeft]);

  const syncScoreToServer = async (gameType, payload) => {
    if (!player) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/game/${roundId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: player.rollNumber, gameType, payload }),
      });
    } catch (err) { }
  };

  const gameProps = { 
    timeLeft, 
    setTimeLeft, 
    timerActive, 
    rollNumber: player?.rollNumber, 
    syncScoreToServer, 
    onGameStart,
    roundId
  };

  return (
    <div className="h-screen w-screen bg-[#050510] text-slate-200 flex overflow-hidden font-sans select-none relative">
      
      {/* LEFT SIDEBAR: MODE SELECTOR & TIMER (Collapses on Mobile) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 bg-[#08081a] transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-indigo-600/20' : '-translate-x-full'}`}>
        <div className="px-6 py-6 flex justify-between items-center group">
          <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase italic transition-colors hover:text-white">AAYAM v1.2</h2>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 p-1"><X size={16} /></button>
        </div>

        {/* MISSION TIMER (GLOBAL 10 MIN) */}
        <div className="mb-6 px-6 py-4 flex flex-col items-center border-b border-white/5 opacity-50">
            <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">GLOBAL SESSION</div>
            <div className="text-xl font-black italic tabular-nums text-indigo-400">
               {formatTime(timeLeft)}
            </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          <div className="bg-indigo-600 shadow-lg text-white w-full flex items-center gap-3 p-3.5 rounded-xl transition-all group cursor-default">
            <Crosshair size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Dimension {roundId}</span>
          </div>
        </nav>

        <div className="p-4 flex flex-col items-center gap-1.5 opacity-30 mt-auto border-t border-white/5">
           <button onClick={() => navigate('/rounds')} className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-red-500 transition-colors py-2 uppercase tracking-widest"><LogOut size={12} /> Leave Round</button>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[100px]">TRIPLE THREAT</span>
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

        {/* MAIN GAMEPLAY CONTAINER */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-4 md:pb-8 z-10 w-full overflow-hidden relative">
          
          {!isLive && (
             <div className="absolute inset-0 z-50 bg-[#02020a]/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto rounded-3xl m-4 md:m-8 border border-white/5">
                <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-500/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                   <Timer size={40} className="text-red-500 animate-pulse" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-white italic drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">MATCH LOCKED</h2>
                <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.5em] mt-4 italic text-center px-6">Awaiting Admin Authorization to Proceed.</p>
             </div>
          )}

          <div className={`w-full max-w-5xl mx-auto h-[80vh] flex flex-col pt-8 z-10 transition-all duration-500 ${!isLive ? 'opacity-20 blur-[2px] pointer-events-none scale-[0.98]' : 'scale-100 opacity-100'}`}>
              
              {/* Top Navigation Tabs */}
              <div className="flex bg-[#0a0a1a]/80 backdrop-blur-2xl rounded-t-3xl border border-white/5 border-b-0 overflow-hidden">
                 {['contexto', 'wordle', 'grouping'].map(game => (
                    <button 
                      key={game}
                      onClick={() => setActiveGame(game)}
                      className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeGame === game ? (
                        game === 'contexto' ? 'bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-500' :
                        game === 'wordle' ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500' :
                        'bg-fuchsia-500/20 text-fuchsia-400 border-b-2 border-fuchsia-500'
                      ) : 'text-slate-500 hover:bg-white/5'}`}
                    >
                       {game}
                    </button>
                 ))}
              </div>

              {/* Instance Selector Tabs */}
              <div className="flex bg-[#050510]/50 backdrop-blur-md border-x border-white/5 border-b border-white/5">
                 {[1, 2].map(inst => (
                    <button 
                      key={inst}
                      onClick={() => setActiveInstance(inst)}
                      className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${activeInstance === inst ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                       Instance {inst}
                    </button>
                 ))}
              </div>

              {/* Active Game Window */}
              <div className="flex-1 bg-[#0a0a1a]/80 backdrop-blur-xl rounded-b-3xl border border-white/5 border-t-0 shadow-2xl relative overflow-hidden p-4 md:p-8">
                 {activeGame === 'contexto' && <Contexto_Superstar key={`contexto-${activeInstance}`}  {...gameProps} instance={activeInstance} />}
                  {activeGame === 'wordle' && (<Wordle_Superstar  key={`wordle-${activeInstance}`}  {...gameProps}  instance={activeInstance} />)}
                 {activeGame === 'grouping' && <Grouping_Superstar 
  key={`grouping-${activeInstance}`} 
  {...gameProps} 
  instance={activeInstance} 
/>}
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