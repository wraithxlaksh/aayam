import React, { useState, useEffect } from 'react';
import { Trophy, Activity, Medal } from 'lucide-react';

const PublicLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (err) {}
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#05050A] text-white flex flex-col items-center justify-center p-8 font-sans overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,0,255,0.15),transparent_70%)] pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-200 to-indigo-600 drop-shadow-[0_0_20px_rgba(79,70,229,0.3)] mb-4">
            AAYAM
          </h1>
          <p className="text-xl md:text-3xl font-black tracking-[0.3em] uppercase text-indigo-400">
            Global Standings
          </p>
        </div>

        <div className="bg-[#0a0a1a]/80 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-10">
          <div className="space-y-4">
            {leaderboard.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                Awaiting Protocol Initiation...
              </div>
            ) : (
              leaderboard.map((item, index) => (
                <div 
                  key={item.rollNumber} 
                  className={`flex items-center justify-between p-4 md:p-6 rounded-2xl border transition-all duration-500 ${
                    index === 0 ? 'bg-indigo-900/40 border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.2)]' : 
                    index === 1 ? 'bg-slate-800/40 border-slate-600/50' : 
                    index === 2 ? 'bg-amber-900/20 border-amber-700/30' : 
                    'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                      index === 0 ? 'bg-indigo-500 text-white shadow-lg' : 
                      index === 1 ? 'bg-slate-300 text-slate-800' : 
                      index === 2 ? 'bg-amber-600 text-white' : 
                      'bg-black/50 text-slate-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-wider">{item.name}</h3>
                      <p className="text-sm text-slate-400 font-mono">{item.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <h2 className={`text-4xl font-black ${
                      index === 0 ? 'text-indigo-300' : 'text-slate-300'
                    }`}>{item.score}</h2>
                    <span className="text-sm font-bold text-slate-500 mt-2">PTS</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLeaderboard;
