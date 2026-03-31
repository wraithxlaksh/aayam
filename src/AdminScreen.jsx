import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogOut, RefreshCw, Trophy, User } from 'lucide-react';

const AdminScreen = ({ onLogout }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newRoundName, setNewRoundName] = useState('');
  const [dimensionType, setDimensionType] = useState('TRIPLE_THREAT');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [qualifyCount, setQualifyCount] = useState(4);

  const fetchRounds = async () => {
    const token = JSON.parse(localStorage.getItem('aayam_player'))?.token;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: token })
      });
      if(res.ok) {
         const data = await res.json();
         setRounds(data.rounds || []);
      }
    } catch {}
  };

  useEffect(() => {
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL}/api/stream`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'LEADERBOARD') {
        setLeaderboard(data.payload);
        setLoading(false);
        setError(null);
      }
    };

    eventSource.onerror = () => {
      setError('SSE Connection lost. Backend may be offline.');
      setLoading(false);
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    fetchRounds();
  }, []);

  const handleCreateRound = async () => {
    if (!newRoundName.trim()) return;
    const token = JSON.parse(localStorage.getItem('aayam_player'))?.token;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/rounds/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: token, name: newRoundName, dimension_type: dimensionType, max_players: dimensionType === 'TRIPLE_THREAT' ? 8 : Number(maxPlayers) })
      });
      if (res.ok) {
        setNewRoundName('');
        fetchRounds();
      } else {
        const errData = await res.json().catch(() => null);
        setError(`Failed to create round: ${errData?.error || 'Unknown error'}`);
      }
    } catch { setError('Network failure while creating round.'); }
  };

  const handleStartRound = async (roundId) => {
    const token = JSON.parse(localStorage.getItem('aayam_player'))?.token;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/rounds/${roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: token })
      });
      if (res.ok) {
         fetchRounds();
      } else {
         const errData = await res.json().catch(() => null);
         setError(`Failed to start round ${roundId}: ${errData?.error || 'Unknown error'}`);
      }
    } catch { setError(`Network failure while starting round ${roundId}.`); }
  };

  const handleQualify = async () => {
    const token = JSON.parse(localStorage.getItem('aayam_player'))?.token;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/qualify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: token, count: qualifyCount })
      });
    } catch { setError('Failed to set qualified players.'); }
  };

  return (
    <div className="min-h-screen w-full bg-[#03030f] text-slate-200 p-4 md:p-8 font-sans overflow-auto relative select-none">
      {/* Dynamic Network Grid matches LoginScreen style */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-[#0a0a1a]/80 p-4 md:p-6 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center shadow-lg shadow-fuchsia-600/10">
              <ShieldCheck className="text-fuchsia-400" size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white">ADMIN <span className="text-fuchsia-500">OVERVIEW</span></h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-5 py-3 bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/10"
            >
              <LogOut size={14} /> Exit
            </button>
          </div>
        </header>

        {/* ADMIN CONTROLS MULTIPLEXER */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Create Round */}
           <div className={`p-6 rounded-2xl border transition-all bg-[#0a0a1a]/80 border-white/5`}>
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Create New Dimension</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Form a new lobby for 8 concurrent players</p>
                 </div>
              </div>
              <div className="flex flex-col gap-3">
                 <input 
                   type="text" 
                   value={newRoundName}
                   onChange={(e) => setNewRoundName(e.target.value)}
                   placeholder="E.g. Alpha Set"
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-indigo-500/50"
                 />
                 <div className="flex gap-3">
                   <select 
                     value={dimensionType}
                     onChange={(e) => setDimensionType(e.target.value)}
                     className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-indigo-500/50"
                   >
                      <option value="TRIPLE_THREAT" className="text-black">TRIPLE THREAT (8 PLAYERS)</option>
                      <option value="MIND_SYNC" className="text-black">MIND SYNC (CUSTOM)</option>
                   </select>
                   {dimensionType === 'MIND_SYNC' && (
                     <input 
                       type="number" 
                       min="1" max="50"
                       value={maxPlayers}
                       onChange={(e) => setMaxPlayers(e.target.value)}
                       placeholder="Max"
                       className="w-20 bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-sm font-black text-white outline-none focus:border-indigo-500/50 text-center"
                     />
                   )}
                 </div>
                 <button 
                   onClick={handleCreateRound}
                   className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                 >
                   DEPLOY LOBBY
                 </button>
              </div>
           </div>

           {/* Qualification Tool */}
           <div className="p-6 rounded-2xl bg-[#0a0a1a]/80 border border-white/5 flex flex-col justify-between">
              <div className="mb-4">
                 <h3 className="text-sm font-black uppercase tracking-widest text-white">Qualification Protocol</h3>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Set Top N players via rank to advance to Mind-Sync</p>
              </div>
              <div className="flex gap-3 h-10">
                 <input 
                   type="number" 
                   min="1" max="100"
                   value={qualifyCount}
                   onChange={(e) => setQualifyCount(e.target.value)}
                   className="w-20 bg-white/5 border border-white/10 rounded-xl text-center text-sm font-black text-white outline-none focus:border-fuchsia-500/50"
                 />
                 <button 
                   onClick={handleQualify}
                   className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-fuchsia-600/20"
                 >
                   APPLY QUALIFIERS ({qualifyCount})
                 </button>
              </div>
           </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/10 border border-red-500/20 rounded-2xl">
             <p className="text-[10px] font-black italic text-red-500 uppercase tracking-widest text-center">{error}</p>
          </div>
        )}

        <div className="bg-[#0a0a1a]/90 backdrop-blur-3xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl mb-8">
          <div className="flex items-center gap-3 p-6 md:p-8 border-b border-white/5 bg-white/[0.02]">
            <Trophy className="text-fuchsia-500" size={24} />
            <h2 className="text-xl font-black italic tracking-tighter text-white">ROUND <span className="text-slate-500">SYSTEM LOGS</span></h2>
            <button onClick={fetchRounds} className="ml-auto text-slate-500 hover:text-white transition-colors"><RefreshCw size={16} /></button>
          </div>
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {rounds.length === 0 ? (
               <div className="col-span-1 md:col-span-2 text-center py-10 text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">No Rounds Formed Yet.</div>
            ) : rounds.map((round) => (
               <div key={`round-${round.roundNumber}`} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                     <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Round {round.roundNumber}: {round.name}</h3>
                        {round.status === 'UPCOMING' && <span className="text-[9px] font-black tracking-widest bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">UPCOMING</span>}
                        {round.status === 'LIVE' && <span className="text-[9px] font-black tracking-widest bg-red-500/20 text-red-500 px-2 py-0.5 rounded animate-pulse">LIVE</span>}
                        {round.status === 'COMPLETED' && <span className="text-[9px] font-black tracking-widest bg-slate-500/20 text-slate-500 px-2 py-0.5 rounded">COMPLETED</span>}
                     </div>
                     <span className="text-[10px] text-slate-500 font-bold bg-black/50 px-2 py-1 rounded">{round.players.length}/8 Players</span>
                  </div>
                  {round.status === 'UPCOMING' && (
                     <button 
                        onClick={() => handleStartRound(round.roundNumber)}
                        className="w-full mb-3 py-2 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white border border-green-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                     >
                        START ROUND NOW
                     </button>
                  )}
                  <div className="space-y-2">
                     {round.players.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-black/20 p-2 rounded">
                           <span className="font-bold text-slate-300">{p.name || 'Unknown'}</span>
                           <span className="text-indigo-400 font-mono">{p.totalScore} PTS</span>
                        </div>
                     ))}
                     {round.players.length === 0 && <div className="text-[10px] text-slate-600 italic">No players joined.</div>}
                  </div>
               </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a1a]/90 backdrop-blur-3xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 p-6 md:p-8 border-b border-white/5 bg-white/[0.02]">
            <Trophy className="text-fuchsia-500" size={24} />
            <h2 className="text-xl font-black italic tracking-tighter text-white">OVERALL <span className="text-slate-500">RECORDS</span></h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01] text-[10px] uppercase font-black tracking-widest text-slate-600">
                  <th className="py-5 pl-6 sm:pl-8">Rank</th>
                  <th className="py-5">Identity</th>
                  <th className="py-5">Status</th>
                  <th className="py-5">Roll ID</th>
                  <th className="py-5 text-right pr-6 sm:pr-8">Gross Score</th>
                </tr>
              </thead>
              <tbody>
                {loading && leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-20">
                      <RefreshCw size={28} className="animate-spin text-fuchsia-500 mx-auto mb-5 opacity-80" />
                      <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-600 italic">Decrypting Database...</p>
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-20 text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">
                      No Competitor Signatures Detected.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((player, index) => (
                    <tr key={player.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                      <td className="py-5 pl-6 sm:pl-8">
                        <span className={`text-sm font-black italic ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-orange-400' : 'text-slate-600'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all ${player.is_qualified ? 'text-green-400 border-green-500/20' : 'text-slate-500 group-hover:text-fuchsia-400 group-hover:border-fuchsia-500/30'}`}>
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-300 group-hover:text-white transition-colors">{player.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                          {player.is_qualified ? (
                             <span className="text-[9px] font-black bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded tracking-widest uppercase">QUALIFIED</span>
                          ) : (
                             <span className="text-[9px] font-black bg-white/5 text-slate-500 px-2 py-1 rounded tracking-widest uppercase">ELIMINATED</span>
                          )}
                      </td>
                      <td className="py-5">
                          <span className="text-[11px] font-mono text-slate-400 tracking-wider bg-black/50 px-3 py-1.5 rounded-lg border border-white/5">
                              {player.rollNumber}
                          </span>
                      </td>
                      <td className="py-5 pr-6 sm:pr-8 text-right">
                        <span className="inline-block px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[11px] font-black tracking-widest group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg shadow-indigo-500/0 group-hover:shadow-indigo-500/20">
                         {Number(player?.totalScore || 0).toLocaleString()} PTS
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;
