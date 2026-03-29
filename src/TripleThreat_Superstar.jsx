import React, { useState } from 'react';
import Contexto_Superstar from './Contexto_Superstar';
import Grouping_Superstar from './Grouping_Superstar';

const TripleThreat_Superstar = ({ onExit }) => {
  const [activeGame, setActiveGame] = useState('menu'); // 'menu', 'contexto', 'grouping'

  const games = [
    {
      id: 'contexto',
      title: 'CONTEXTO',
      description: 'The semantic distance challenge. Use your physics intuition to find the hidden keyword.',
      icon: '🎯',
      color: 'from-cyan-500 to-blue-600',
      tag: 'Physics Semantic'
    },
    {
      id: 'grouping',
      title: 'GROUPING',
      description: 'Categorize 16 fundamental physics terms into 4 logical groups. 5 attempts only.',
      icon: '🧩',
      color: 'from-blue-600 to-indigo-700',
      tag: 'Physics Logic'
    },
    {
      id: 'placeholder',
      title: '???',
      description: 'The third threat is approaching. Stay tuned for the expansion.',
      icon: '🔒',
      color: 'from-gray-700 to-gray-900',
      tag: 'Coming Soon',
      locked: true
    }
  ];

  if (activeGame === 'contexto') {
    return <Contexto_Superstar onBack={() => setActiveGame('menu')} />;
  }

  if (activeGame === 'grouping') {
    return <Grouping_Superstar onBack={() => setActiveGame('menu')} />;
  }

  return (
    <div className="min-h-screen bg-[#050510] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>

      <div className="z-10 w-full max-w-6xl">
        {/* Header */}
        <header className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <button 
            onClick={onExit}
            className="mb-4 text-gray-500 hover:text-white transition-colors text-sm uppercase tracking-widest"
          >
            ← Exit to Main Platform
          </button>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4">
            TRIPLE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">THREAT</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto uppercase tracking-wide">
            Three distinct dimensions of physical cognition.
          </p>
        </header>

        {/* Game Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <div 
              key={game.id}
              onClick={() => !game.locked && setActiveGame(game.id)}
              className={`group relative p-[1px] rounded-3xl overflow-hidden transition-all duration-500 
                ${game.locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] animate-in fade-in slide-in-from-bottom-8'}`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Animated Gradient Border */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Card Content */}
              <div className="relative bg-[#0a0a15] h-full rounded-[23px] p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl">{game.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500/80 border border-cyan-500/30 px-2 py-1 rounded">
                      {game.tag}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 tracking-tight">{game.title}</h2>
                  <p className="text-gray-400 leading-relaxed text-sm mb-8">
                    {game.description}
                  </p>
                </div>

                <div className="mt-auto">
                  {!game.locked ? (
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                      Deploy Game <span>→</span>
                    </div>
                  ) : (
                    <div className="text-gray-600 font-bold text-xs uppercase tracking-widest">
                      Encryption Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Meta */}
        <footer className="mt-20 text-center border-t border-white/5 pt-8">
          <div className="flex justify-center gap-8 text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">
            <span>System: Physics Carnival</span>
            <span>Status: Alpha 1.0</span>
            <span>Terminal: Superstar</span>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default TripleThreat_Superstar;
