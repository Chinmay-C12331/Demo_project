import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HandshakeSimulator } from './components/HandshakeSimulator';
import { LatticeLab } from './components/LatticeLab';
import { AlgorithmMatrix } from './components/AlgorithmMatrix';
import { NetworkTopologyAudit } from './components/NetworkTopologyAudit';
import { AdvisorChat } from './components/AdvisorChat';
import { Shield, Cpu, Lock, ArrowUpRight, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'handshake' | 'lattice' | 'algorithms' | 'topology' | 'advisor'>('handshake');

  const handleQuickSimulate = () => {
    setActiveTab('handshake');
    // Scroll smoothly to simulator
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract Compliant Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickSimulate={handleQuickSimulate}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Executive Kicker & Protocol Stat Strip */}
        <div className="border border-slate-800 bg-slate-900/70 rounded-lg p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider font-mono">Quantum Cryptanalysis Defense</span>
              <span aria-hidden="true">·</span>
              <span>NIST Standards 2024-2026</span>
              <span aria-hidden="true">·</span>
              <span>IETF TLS 1.3 / IPsec / SSH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Post-Quantum Cryptography for Network Security
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Cryptanalytically Relevant Quantum Computers (CRQC) break RSA, ECDHE, and DSA via Shor's algorithm. 
              Evaluate NIST FIPS 203 Module-LWE key encapsulation, packet MTU fragmentation, and enterprise migration strategies.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0 text-center w-full lg:w-auto">
            <div className="bg-slate-950/80 px-4 py-2.5 rounded border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">FIPS Standard</span>
              <span className="text-sm font-bold font-mono text-cyan-400">ML-KEM-768</span>
            </div>
            <div className="bg-slate-950/80 px-4 py-2.5 rounded border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Wire Key Share</span>
              <span className="text-sm font-bold font-mono text-slate-200">1,184 Bytes</span>
            </div>
            <div className="bg-slate-950/80 px-4 py-2.5 rounded border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">HNDL Risk</span>
              <span className="text-sm font-bold font-mono text-rose-400">Active Today</span>
            </div>
          </div>
        </div>

        {/* Workspace Mode Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          {[
            { id: 'handshake', label: '1. TLS 1.3 Handshake Simulator', tab: 'handshake' as const },
            { id: 'lattice', label: '2. Lattice LWE Mathematics', tab: 'lattice' as const },
            { id: 'algorithms', label: '3. NIST Standards & MTU Matrix', tab: 'algorithms' as const },
            { id: 'topology', label: '4. Network Topology & Mosca Audit', tab: 'topology' as const },
            { id: 'advisor', label: '5. RFC & Cryptographic Advisor', tab: 'advisor' as const },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.tab)}
              className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === item.tab
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab Viewport Content */}
        {activeTab === 'handshake' && (
          <HandshakeSimulator onHighlightLattice={() => setActiveTab('lattice')} />
        )}

        {activeTab === 'lattice' && (
          <LatticeLab />
        )}

        {activeTab === 'algorithms' && (
          <AlgorithmMatrix />
        )}

        {activeTab === 'topology' && (
          <NetworkTopologyAudit />
        )}

        {activeTab === 'advisor' && (
          <AdvisorChat />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-6 px-6 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PQ-Shield Architecture Prototype</span>
            <span aria-hidden="true">·</span>
            <span>NIST FIPS 203 / 204 / 205</span>
            <span aria-hidden="true">·</span>
            <span>IETF draft-ietf-tls-hybrid-design</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>TCP MSS: 1460B</span>
            <span>Shor's Bound: O(log³N)</span>
            <span>Grover's Bound: O(√N)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
