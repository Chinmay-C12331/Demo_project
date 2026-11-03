import React from 'react';
import { Shield, Cpu, Network, Binary, MessageSquareCode } from 'lucide-react';

interface NavigationProps {
  activeTab: 'handshake' | 'lattice' | 'algorithms' | 'topology' | 'advisor';
  setActiveTab: (tab: 'handshake' | 'lattice' | 'algorithms' | 'topology' | 'advisor') => void;
  onQuickSimulate: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onQuickSimulate,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Shield className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white">
          PQ-Shield <span className="text-cyan-400 font-mono text-xs font-normal ml-1">FIPS 203/204</span>
        </span>
      </div>

      {/* Zone 2: 4-5 concise single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('handshake')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'handshake' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Handshake Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('lattice')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'lattice' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Lattice LWE Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('algorithms')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'algorithms' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>NIST Standards & MTU</span>
        </button>

        <button
          onClick={() => setActiveTab('topology')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'topology' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Network Topology</span>
        </button>

        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'advisor' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <MessageSquareCode className="w-4 h-4" />
          <span>RFC Cryptographic Advisor</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onQuickSimulate}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-500/20 active:translate-y-px"
        >
          Run Quantum Test
        </button>
      </div>
    </header>
  );
};
