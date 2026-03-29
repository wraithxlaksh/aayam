import { BrainCircuit, Crosshair } from "lucide-react";

export default function AayamScreen({ onNavigateTripleThreat }) {
  return (
    <div className="min-h-screen bg-[#050516] text-white flex">

      {/* LEFT SIDEBAR (Rounds) */}
      <aside className="w-64 border-r border-white/10 p-4 hidden sm:block">
        <h2 className="text-lg font-semibold mb-4 text-purple-400">
          Rounds
        </h2>

        <div className="space-y-3">
          <button 
            onClick={onNavigateTripleThreat}
            className="w-full bg-purple-600/20 p-3 flex rounded-xl justify-center items-center hover:bg-purple-600/30 transition-all active:scale-95"
          >
           <Crosshair size={24}/> <Crosshair size={20}/> <Crosshair size={18}/>  Triple Threat
          </button>
          <div className="bg-white/5 p-3 flex justify-center items-center  rounded-xl p-2">
            <BrainCircuit/> Mind Sync
          </div>
        </div>
      </aside>

      {/* CENTER (MAIN GAME AREA) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">

        {/* Top Bar */}
        <div className="w-full max-w-4xl flex justify-between mb-4">
          <h1 className="text-2xl font-bold text-purple-400">
            AAYAM
          </h1>

          <div className="text-sm text-gray-400">
            ⏱ 08:32
          </div>
        </div>

        {/* Game Container */}
        <div className="w-full max-w-4xl bg-[#0a0a1a] rounded-2xl p-6 shadow-xl">

          <h2 className="text-lg mb-4 font-semibold">
            Contexto (Physics)
          </h2>

          {/* Input */}
          <input
            type="text"
            placeholder="Enter your guess..."
            className="w-full p-3 rounded-xl bg-black border border-white/10 focus:outline-none focus:border-purple-500"
          />

          {/* Sample Output */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between bg-white/5 p-2 rounded-lg">
              <span>Force</span>
              <span className="text-green-400">Rank #12</span>
            </div>

            <div className="flex justify-between bg-white/5 p-2 rounded-lg">
              <span>Gravity</span>
              <span className="text-yellow-400">Rank #3</span>
            </div>
          </div>

        </div>
      </main>

      {/* RIGHT SIDEBAR (Leaderboard) */}
      <aside className="w-72 border-l border-white/10 p-4 hidden lg:block">
        <h2 className="text-lg font-semibold mb-4 text-green-400">
          Leaderboard
        </h2>

        <div className="space-y-3">

          <div className="flex justify-between bg-green-500/10 p-3 rounded-xl">
            <span>#1 Lakshya</span>
            <span>120</span>
          </div>

          <div className="flex justify-between bg-white/5 p-3 rounded-xl">
            <span>#2 Player2</span>
            <span>110</span>
          </div>

          <div className="flex justify-between bg-white/5 p-3 rounded-xl">
            <span>#3 Player3</span>
            <span>95</span>
          </div>

        </div>
      </aside>

    </div>
  );
}