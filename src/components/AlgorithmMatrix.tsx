import React, { useState } from 'react';
import { PQC_ALGORITHMS } from '../data/pqcAlgorithms';
import { PQCAlgorithm, AlgorithmCategory } from '../types/pqc';
import { 
  Cpu, 
  BarChart3, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Layers,
  Search,
  Filter
} from 'lucide-react';

export const AlgorithmMatrix: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlgo, setSelectedAlgo] = useState<PQCAlgorithm>(PQC_ALGORITHMS[0]);
  const [networkSpeedMbps, setNetworkSpeedMbps] = useState<number>(100);
  const [networkRttMs, setNetworkRttMs] = useState<number>(30);

  const filtered = PQC_ALGORITHMS.filter((algo) => {
    const matchesCategory =
      filterCategory === 'ALL' ||
      (filterCategory === 'KEM' && (algo.category === 'KEM' || algo.category === 'Classical_KEM')) ||
      (filterCategory === 'SIGNATURE' && (algo.category === 'Signature' || algo.category === 'Classical_Sig')) ||
      (filterCategory === 'HYBRID' && algo.category === 'Hybrid') ||
      (filterCategory === 'PQC_ONLY' && algo.quantumResistant);

    const matchesSearch =
      algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.family.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Calculate transmission latency over network
  const calcTransmissionTimeMs = (bytes: number) => {
    const bits = bytes * 8;
    const bandwidthBps = networkSpeedMbps * 1_000_000;
    const transferMs = (bits / bandwidthBps) * 1000;
    // MTU 1500 overhead: if exceeds 1500, additional segment reassembly RTT
    const segments = Math.ceil(bytes / 1460);
    const rttOverhead = segments > 1 ? (segments - 1) * (networkRttMs * 0.15) : 0;
    return (transferMs + rttOverhead).toFixed(3);
  };

  const maxByteScale = 8000;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
              NIST FIPS 203, 204, 205 Standards
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Post-Quantum vs Classical Cryptography Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore key sizes, CPU cycle benchmarks, and wire transmission overheads across standardized algorithms.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ML-KEM, Dilithium..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded border border-slate-800">
              {[
                { label: 'All', val: 'ALL' },
                { label: 'KEM (Key Exchange)', val: 'KEM' },
                { label: 'Signatures', val: 'SIGNATURE' },
                { label: 'Hybrid', val: 'HYBRID' },
                { label: 'PQC Only', val: 'PQC_ONLY' },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => setFilterCategory(tab.val)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                    filterCategory === tab.val
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Table + Deep Dive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
            <span className="text-xs font-semibold text-slate-300">
              Algorithm Benchmark Specification ({filtered.length} entries)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Click a row to inspect network packet footprint
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Standard</th>
                  <th className="py-2.5 px-3">Family</th>
                  <th className="py-2.5 px-3 text-right">Public Key</th>
                  <th className="py-2.5 px-3 text-right">Cipher/Sig</th>
                  <th className="py-2.5 px-3 text-center">NIST Level</th>
                  <th className="py-2.5 px-3 text-center">Quantum Safe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filtered.map((algo) => {
                  const isSelected = selectedAlgo.id === algo.id;
                  return (
                    <tr
                      key={algo.id}
                      onClick={() => setSelectedAlgo(algo)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/60 text-cyan-200'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3 font-medium text-white font-sans flex items-center gap-1.5">
                        <span className="truncate">{algo.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {algo.standard}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {algo.family}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-200">
                        {algo.publicKeyBytes.toLocaleString()} B
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-cyan-300">
                        {algo.cipherOrSigBytes.toLocaleString()} B
                      </td>
                      <td className="py-3 px-3 text-center">
                        {algo.nistLevel > 0 ? (
                          <span className="text-cyan-400 font-bold">L{algo.nistLevel}</span>
                        ) : (
                          <span className="text-rose-400 font-bold">L0 (Broken)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {algo.quantumResistant ? (
                          <span className="text-emerald-400 font-bold">Safe</span>
                        ) : (
                          <span className="text-rose-400 font-bold">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Selected Algorithm Footprint & Network Simulation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Detail card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Detailed Analysis
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {selectedAlgo.category}
              </span>
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              {selectedAlgo.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {selectedAlgo.description}
            </p>

            {/* Wire Size Breakdown Bars */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-slate-400">Public Key Size</span>
                  <span className="text-white font-semibold tabular-nums">
                    {selectedAlgo.publicKeyBytes.toLocaleString()} B
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-cyan-500 h-full transition-all"
                    style={{ width: `${Math.min(100, (selectedAlgo.publicKeyBytes / maxByteScale) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-mono text-[11px] mb-1">
                  <span className="text-slate-400">Ciphertext / Signature Size</span>
                  <span className="text-cyan-300 font-semibold tabular-nums">
                    {selectedAlgo.cipherOrSigBytes.toLocaleString()} B
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all"
                    style={{ width: `${Math.min(100, (selectedAlgo.cipherOrSigBytes / maxByteScale) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Network Impact Callout */}
            <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-cyan-400 block mb-1">Network & MTU Impact:</span>
              {selectedAlgo.networkImpact}
            </div>
          </div>

          {/* Network Transmission Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Wire Latency Calculator</h4>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Simulate packet transit time over different network tiers including TCP packet fragmentation overhead:
            </p>

            {/* Preset connection speeds */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Datacenter (1 Gbps)', speed: 1000, rtt: 5 },
                { label: 'Broadband (100 Mbps)', speed: 100, rtt: 25 },
                { label: '4G Mobile (10 Mbps)', speed: 10, rtt: 60 },
                { label: 'IoT / Satellite (1 Mbps)', speed: 1, rtt: 120 },
              ].map((tier) => (
                <button
                  key={tier.label}
                  onClick={() => {
                    setNetworkSpeedMbps(tier.speed);
                    setNetworkRttMs(tier.rtt);
                  }}
                  className={`p-2 text-left rounded text-xs transition-colors border ${
                    networkSpeedMbps === tier.speed
                      ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  <span className="font-semibold block text-[11px] text-white">{tier.label}</span>
                  <span className="font-mono text-[10px] text-slate-500">RTT: {tier.rtt}ms</span>
                </button>
              ))}
            </div>

            {/* Calculated Results */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Transmitted Bytes:</span>
                <span className="text-white font-bold">
                  {(selectedAlgo.publicKeyBytes + selectedAlgo.cipherOrSigBytes).toLocaleString()} B
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TCP 1500B MTU Segments:</span>
                <span className="text-amber-300 font-bold">
                  {Math.ceil((selectedAlgo.publicKeyBytes + selectedAlgo.cipherOrSigBytes) / 1460)} packets
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-cyan-400">Estimated Wire Transit:</span>
                <span className="text-cyan-300 font-bold">
                  {calcTransmissionTimeMs(selectedAlgo.publicKeyBytes + selectedAlgo.cipherOrSigBytes)} ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
