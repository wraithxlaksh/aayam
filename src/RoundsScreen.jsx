import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle } from 'lucide-react';

const RoundsScreen = ({ player, onLogout }) => {
  const [rounds, setRounds] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRounds();
    const interval = setInterval(fetchRounds, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRounds = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/rounds?rollNumber=${player.rollNumber}`);
      if (res.ok) {
        const data = await res.json();
        setRounds(data.rounds || []);
      }
    } catch (err) {}
  };

  const handleEnroll = async (roundId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/rounds/enroll/${roundId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: player.rollNumber })
      });
      if (res.ok) {
        fetchRounds();
        setErrorMsg('');
      } else {
        const error = await res.json();
        setErrorMsg(error.error || "Enrollment failed");
      }
    } catch (err) {
      setErrorMsg("Network error during enrollment.");
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-white p-6 font-sans">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,50,255,0.05),transparent_50%)] pointer-events-none"></div>

       <div className="max-w-6xl mx-auto pt-10 relative z-10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-indigo-900/50 pb-6 gap-4">
            <div>
               <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-indigo-400">AAYAM <span className="text-white">LOBBY</span></h1>
               <p className="text-xs md:text-sm font-bold tracking-[0.2em] text-slate-500 uppercase mt-2">Authenticated as <span className="text-indigo-300">{player.name}</span></p>
            </div>
            <button onClick={onLogout} className="text-xs font-bold border border-red-500/20 hover:bg-red-500/20 text-slate-400 hover:text-red-400 px-6 py-3 rounded-xl transition-colors">DISCONNECT</button>
         </div>

         {errorMsg && (
           <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold uppercase tracking-wider">
             <AlertCircle size={16} />
             {errorMsg}
           </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {rounds.map(round => {
             const isFull = round.enrolledCount >= round.max_players;
             const isEnrolled = round.isEnrolled;
             
             return (
               <div key={round.id} className="bg-[#0a0a1a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-xl">
                  {round.status === 'LIVE' && <div className="absolute top-0 right-0 py-1.5 px-4 bg-red-500 text-white text-[10px] font-black tracking-widest uppercase shadow-[0_4px_20px_rgba(220,38,38,0.5)]">LIVE NOW</div>}
                  {round.status === 'COMPLETED' && <div className="absolute top-0 right-0 py-1.5 px-4 bg-slate-800 text-white text-[10px] font-black tracking-widest uppercase">OVER</div>}
                  {round.status === 'UPCOMING' && isEnrolled && <div className="absolute top-0 right-0 py-1.5 px-4 bg-green-500/20 text-green-400 border-b border-l border-green-500/20 text-[10px] font-black tracking-widest uppercase">ENROLLED</div>}
                  
                  <h3 className="text-2xl font-black text-white mt-3 truncate pr-16">{round.name}</h3>
                  <div className="flex gap-4 mt-8">
                     <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                       <Users size={14} className={isFull ? 'text-red-400' : 'text-indigo-400'} />
                       {round.enrolledCount} / {round.max_players} Filled
                     </div>
                  </div>

                  <div className="mt-8">
                     {round.status === 'UPCOMING' && (
                        isEnrolled ? (
                           <button disabled className="w-full border border-green-500/50 text-green-400 font-black tracking-widest py-4 rounded-xl opacity-70 cursor-wait">
                              WAITING TO START...
                           </button>
                        ) : (
                           <button onClick={() => handleEnroll(round.id)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black tracking-widest py-4 rounded-xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-30 disabled:hover:bg-indigo-600" disabled={isFull}>
                              {isFull ? 'ROUND FULL' : 'ENROLL'}
                           </button>
                        )
                     )}
                     
                     {round.status === 'LIVE' && (
                        isEnrolled ? (
                           <button onClick={() => navigate(`/round/${round.id}/play`)} className="w-full bg-gradient-to-r from-red-600 to-fuchsia-600 hover:from-red-500 hover:to-fuchsia-500 text-white font-black tracking-widest py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                              ENTER DIMENSION
                           </button>
                        ) : (
                           <button disabled className="w-full bg-slate-900 border border-slate-700 text-slate-500 cursor-not-allowed font-black tracking-widest py-4 rounded-xl">
                              LOCKED OUT
                           </button>
                        )
                     )}
                     
                     {round.status === 'COMPLETED' && (
                        <button disabled className="w-full bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed font-black tracking-widest py-4 rounded-xl">
                           ARCHIVED
                        </button>
                     )}
                  </div>
               </div>
             )
           })}
           {rounds.length === 0 && (
             <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
               <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                 <AlertCircle size={32} className="text-indigo-500/50" />
               </div>
               <span className="text-slate-500 font-black uppercase tracking-[0.2em]">No Active Dimensions Discovered.</span>
             </div>
           )}
         </div>
       </div>
    </div>
  );
};

export default RoundsScreen;
