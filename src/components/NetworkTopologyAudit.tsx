import React, { useState } from 'react';
import { INITIAL_NETWORK_NODES } from '../data/pqcAlgorithms';
import { NetworkNode } from '../types/pqc';
import { 
  Network, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Sliders, 
  Server, 
  Database, 
  Lock, 
  Globe,
  FileCheck
} from 'lucide-react';

export const NetworkTopologyAudit: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>(INITIAL_NETWORK_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(INITIAL_NETWORK_NODES[0].id);

  // Mosca's Theorem Parameters: X + Y > Z
  const [shelfLifeX, setShelfLifeX] = useState<number>(10); // Data shelf-life in years
  const [migrationTimeY, setMigrationTimeY] = useState<number>(4); // Migration time in years
  const [crqcTimeZ, setCrqcTimeZ] = useState<number>(8); // Time until CRQC in years

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const handleUpgradeNode = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          isUpgraded: true,
          currentSuite: n.recommendedUpgrade,
          vulnerabilityStatus: 'PROTECTED_HYBRID',
          notes: 'Patched with Post-Quantum Hybrid ciphersuite. Active against Harvest-Now-Decrypt-Later threats.'
        };
      }
      return n;
    }));
  };

  const handleUpgradeAll = () => {
    setNodes(prev => prev.map(n => ({
      ...n,
      isUpgraded: true,
      currentSuite: n.recommendedUpgrade,
      vulnerabilityStatus: 'PROTECTED_HYBRID',
      notes: 'Fully hardened with post-quantum key encapsulation.'
    })));
  };

  const upgradedCount = nodes.filter(n => n.isUpgraded).length;
  const networkImmunityPercent = Math.round((upgradedCount / nodes.length) * 100);

  // Mosca's theorem condition
  const isVulnerableToday = (shelfLifeX + migrationTimeY) > crqcTimeZ;
  const vulnerabilityWindowYears = (shelfLifeX + migrationTimeY) - crqcTimeZ;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
              Enterprise Infrastructure Audit
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Network Topology & Quantum Vulnerability Scanner
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect protocol ciphersuites across edge gateways, VPN tunnels, and internal service meshes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 block">Overall PQC Readiness</span>
              <span className="text-base font-bold font-mono text-cyan-400">{networkImmunityPercent}% Hardened</span>
            </div>
            <button
              onClick={handleUpgradeAll}
              disabled={upgradedCount === nodes.length}
              className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:hover:bg-cyan-400 rounded transition-colors whitespace-nowrap shadow-sm shadow-cyan-500/20"
            >
              Deploy PQC Across All Nodes
            </button>
          </div>
        </div>
      </div>

      {/* Mosca's Theorem Calculator Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Mosca's Theorem Risk Calculator (X + Y &gt; Z)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Quantum Threat Equation
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Michele Mosca's theorem dictates: if data must remain confidential for <span className="font-mono text-cyan-300 font-semibold">X</span> years, and migration takes <span className="font-mono text-cyan-300 font-semibold">Y</span> years, but a quantum computer arrives in <span className="font-mono text-cyan-300 font-semibold">Z</span> years, your network is <strong className="text-slate-200">already compromised today</strong> via Harvest-Now-Decrypt-Later (HNDL).
        </p>

        {/* 3 Slider Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t border-slate-800/80 mb-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Data Shelf-Life (X)</span>
              <span className="font-mono text-cyan-400 font-bold">{shelfLifeX} years</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={shelfLifeX}
              onChange={(e) => setShelfLifeX(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400"
            />
            <span className="text-[11px] text-slate-500 block mt-1">Duration confidentiality must be guaranteed.</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Migration Timeline (Y)</span>
              <span className="font-mono text-cyan-400 font-bold">{migrationTimeY} years</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={migrationTimeY}
              onChange={(e) => setMigrationTimeY(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400"
            />
            <span className="text-[11px] text-slate-500 block mt-1">Time to re-key HSMs, firewalls, and PKI.</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">CRQC Arrival (Z)</span>
              <span className="font-mono text-amber-400 font-bold">{crqcTimeZ} years (~{2026 + crqcTimeZ})</span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              value={crqcTimeZ}
              onChange={(e) => setCrqcTimeZ(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400"
            />
            <span className="text-[11px] text-slate-500 block mt-1">Estimated time until cryptanalytic quantum machine.</span>
          </div>
        </div>

        {/* Mosca Result Banner */}
        <div className={`p-4 rounded border text-xs leading-relaxed flex items-start gap-3 ${
          isVulnerableToday
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
        }`}>
          {isVulnerableToday ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-sm mb-0.5">
              {isVulnerableToday ? (
                <span>CRITICAL: Network is in Active Quantum Deficit ({vulnerabilityWindowYears} years)</span>
              ) : (
                <span>Adequate Transition Window Available ({crqcTimeZ - (shelfLifeX + migrationTimeY)} years margin)</span>
              )}
            </div>
            <p>
              {isVulnerableToday
                ? `Because X (${shelfLifeX}y) + Y (${migrationTimeY}y) = ${shelfLifeX + migrationTimeY} years, which exceeds Z (${crqcTimeZ} years), traffic transmitted today will still be secret-critical when adversaries decrypt stored wire logs. Immediate migration to ML-KEM-768 is mandatory.`
                : `Your data shelf life and migration plan complete before the expected arrival of cryptanalytic quantum machines. Continue proactive deployment of hybrid key exchange.`}
            </p>
          </div>
        </div>
      </div>

      {/* Network Nodes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Node Cards List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-semibold text-slate-300 pb-1">
            Enterprise Infrastructure Endpoints
          </div>

          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`cursor-pointer p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {node.role.includes('DB') ? (
                      <Database className="w-4 h-4 text-cyan-400" />
                    ) : node.role.includes('Web') ? (
                      <Globe className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Server className="w-4 h-4 text-cyan-400" />
                    )}
                    <span className="font-bold text-sm text-white">{node.name}</span>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    node.isUpgraded
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : node.vulnerabilityStatus === 'CRITICAL_VULNERABLE'
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                  }`}>
                    {node.isUpgraded ? 'PROTECTED (PQC)' : node.vulnerabilityStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mb-2">
                  {node.role} · <span className="font-mono text-slate-300">{node.ip}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-slate-300 border border-slate-800/80 flex justify-between items-center">
                  <span className="truncate mr-2">Active: {node.currentSuite}</span>
                  <span className="text-slate-500 shrink-0">MTU: {node.mtu}B</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Node Details & Patch Action (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Endpoint Cryptographic Audit
              </span>
              <span className="text-xs font-mono text-slate-400">{selectedNode.protocol}</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{selectedNode.name}</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedNode.notes}</p>

            {/* Security Audit Details */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Active Ciphersuite:</span>
                <div className="bg-slate-950 p-2 rounded font-mono text-slate-200 border border-slate-800">
                  {selectedNode.currentSuite}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Recommended Post-Quantum Patch:</span>
                <div className="bg-slate-950 p-2 rounded font-mono text-cyan-300 border border-slate-800">
                  {selectedNode.recommendedUpgrade}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Compliance Standard:</span>
                <span className="font-mono text-slate-200">{selectedNode.rfcStandard}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Active Network Sessions:</span>
                <span className="font-mono text-slate-200">{selectedNode.activeSessions.toLocaleString()} concurrent connections</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            {selectedNode.isUpgraded ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Node upgraded to Post-Quantum Hybrid. Quantum eavesdropping neutralized.</span>
              </div>
            ) : (
              <button
                onClick={() => handleUpgradeNode(selectedNode.id)}
                className="w-full py-2.5 px-4 rounded text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-cyan-500/20"
              >
                <Zap className="w-4 h-4" />
                Apply Post-Quantum Hybrid Patch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
