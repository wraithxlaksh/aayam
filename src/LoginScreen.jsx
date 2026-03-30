import React, { useState } from 'react';
import { User, Hash, Rocket, ChevronRight, Binary, ShieldCheck } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !rollNumber) {
      setError('Identity verification required.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rollNumber }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.player);
      } else {
        setError('Database Offline. Persistence unavailable.');
        setOfflineMode(true);
      }
    } catch (err) {
      setError('Connection link severed. Is the server active?');
      setOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineProceed = () => {
    onLogin({ name, rollNumber, isOffline: true });
  };

  return (
    <div className="min-h-screen w-full bg-[#03030f] text-slate-200 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans select-none">
      
      {/* Dynamic Network Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/5 blur-[100px] rounded-full animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-[#0a0a1a]/90 backdrop-blur-3xl border border-white/5 p-6 md:p-10 rounded-[2rem] shadow-2xl relative z-10">
        
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 mb-4 shadow-lg shadow-indigo-600/10">
            <ShieldCheck className="text-indigo-400" size={28} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white">AAYAM <span className="text-indigo-500">SIGN-IN</span></h1>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.4em] italic mt-2">Authentication Protocol 4.2</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Name</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                 <User size={16} />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-6 text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-white font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Roll Number</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors">
                 <Hash size={16} />
              </div>
              <input 
                type="text" 
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="Identification Number"
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-6 text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-white font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="flex flex-col gap-2.5">
              <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] animate-pulse italic">{error}</p>
              </div>
              {offlineMode && (
                <button 
                  type="button"
                  onClick={handleOfflineProceed}
                  className="w-full bg-slate-900/50 hover:bg-slate-800 border border-white/10 py-3 rounded-xl text-slate-500 text-[8px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 hover:text-white"
                >
                  <Hash size={12} /> BYPASS TO LOCAL GUEST MODE
                </button>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 disabled:opacity-50 group mt-4 overflow-hidden relative"
          >
            {loading ? (
               <Binary className="animate-spin" size={16} />
            ) : (
              <>
                INITIALIZE ENTRY
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={16} />
              </>
            )}
          </button>
        </form>

        <footer className="mt-8 text-center">
           <p className="text-[8px] text-slate-600 uppercase tracking-widest font-mono">No password required. Roll ID is unique.</p>
        </footer>

      </div>

      <div className="mt-8 text-center text-slate-700 text-[8px] font-mono tracking-widest opacity-30">
         AAYAM V1.2 • PHYSICS COMPETITION INTERFACE
      </div>
    </div>
  );
};

export default LoginScreen;
